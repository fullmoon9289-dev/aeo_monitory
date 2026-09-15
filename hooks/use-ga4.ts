'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Ga4Report, Ga4Status } from '@/lib/ga4';

export function useGa4(active: boolean) {
  const [status, setStatus] = useState<Ga4Status | null>(null);
  const [report, setReport] = useState<Ga4Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('days=28');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setReport(null); setStatus(null);
    async function load() {
      const options = { signal: controller.signal, cache: 'no-store' as const };
      const response = await fetch('/api/ga4/status', options);
      const data = await response.json() as Ga4Status & { error?: string };
      if (!response.ok) throw new Error(data.error || 'GA4 연결 상태를 확인하지 못했습니다.');
      if (controller.signal.aborted) return;
      setStatus(data);
      if (!data.connected) return;
      const result = await fetch(`/api/ga4/report?${range}`, options);
      const payload = await result.json() as { report?: Ga4Report; error?: string };
      if (!result.ok || !payload.report) throw new Error(payload.error || 'GA4 보고서를 불러오지 못했습니다.');
      if (!controller.signal.aborted) setReport(payload.report);
    }
    load().catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'GA4 조회에 실패했습니다.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, range, revision]);
  return { status, report, error, loading, range, setRange, reload };
}
export type Ga4Data = ReturnType<typeof useGa4>;
