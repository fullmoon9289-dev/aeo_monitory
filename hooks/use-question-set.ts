'use client';

import { useEffect, useState } from 'react';
import type { ClinicId } from '@/lib/clinics';
import type { QuestionSet } from '@/lib/question-opportunities';

export function useQuestionSet(clinicId: ClinicId, activeView?: string) {
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let controller: AbortController | null = null;
    let disposed = false;
    async function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      try {
        const response = await fetch(`/api/question-opportunities?clinicId=${clinicId}`, { signal: request.signal, cache: 'no-store' });
        const data = await response.json() as { questionSet?: QuestionSet; error?: string };
        if (!response.ok || !data.questionSet) throw new Error(data.error || '질문을 불러오지 못했습니다.');
        if (!disposed && !request.signal.aborted) { setQuestionSet(data.questionSet); setError(''); }
      } catch (cause) {
        if (!disposed && !request.signal.aborted) setError(cause instanceof Error ? cause.message : '자료 확인 필요');
      } finally { if (!disposed && !request.signal.aborted) setLoading(false); }
    }
    const onSaved = (event: Event) => { if ((event as CustomEvent<{ clinicId: string }>).detail?.clinicId === clinicId) void refresh(); };
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh(); };
    void refresh();
    window.addEventListener('search-data-updated', onSaved);
    window.addEventListener('focus', onFocus);
    // While the page is open, catch reports uploaded from another tab or device.
    const timer = window.setInterval(onFocus, 5 * 60_000);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); window.removeEventListener('search-data-updated', onSaved); window.removeEventListener('focus', onFocus); };
  }, [clinicId, activeView]);
  return { questionSet, loading, error };
}
