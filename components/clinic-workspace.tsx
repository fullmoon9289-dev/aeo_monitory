'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Hospital } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoldmanWorkspace } from '@/components/goldman-workspace';

export type ClinicId = 'withyou-clinic' | 'goldman-clinic';
const clinics = [
  { value: 'goldman-clinic', label: '골드만 비뇨의학과' },
  { value: 'withyou-clinic', label: '위드유 의원·한의원' },
];
const ClinicContext = createContext<{ clinicId: ClinicId; selectClinic: (id: ClinicId) => void } | null>(null);

export function ClinicSwitcher({ compact = false }: { compact?: boolean }) {
  const context = useContext(ClinicContext);
  if (!context) return null;
  return (
    <div className={compact ? 'w-[195px] max-w-full' : 'w-full'}>
      {!compact && <div className="mb-2 text-xs font-semibold text-[#777381]">진단할 병원</div>}
      <Select items={clinics} value={context.clinicId} onValueChange={(value) => {
        if (value === 'withyou-clinic' || value === 'goldman-clinic') context.selectClinic(value);
      }}>
        <SelectTrigger aria-label="진단할 병원 선택" className="h-11! w-full min-w-0 border-[#dcd7fa] bg-[#f8f7ff] px-3 text-[13px] font-semibold">
          <Hospital className="size-4 shrink-0 text-[#6957e8]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {clinics.map((clinic) => <SelectItem key={clinic.value} value={clinic.value} className="py-3 text-[13px]">{clinic.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {!compact && <p className="mt-2 text-[11px] leading-4 text-[#8f8b98]">병원별 자료와 발행 계획을 따로 보관합니다.</p>}
    </div>
  );
}

export function ClinicWorkspace({ withyou }: { withyou: ReactNode }) {
  const [clinicId, setClinicId] = useState<ClinicId>('goldman-clinic');
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('clinic');
    let stored: string | null = null;
    try { stored = localStorage.getItem('medianswer.selectedClinic'); } catch { /* Selection is optional. */ }
    const selected = query ?? stored;
    if (selected === 'withyou-clinic' || selected === 'goldman-clinic') setClinicId(selected);
  }, []);
  function selectClinic(id: ClinicId) {
    setClinicId(id);
    try { localStorage.setItem('medianswer.selectedClinic', id); } catch { /* Keep switching usable. */ }
    const url = new URL(window.location.href);
    url.searchParams.set('clinic', id);
    window.history.replaceState(null, '', url);
  }
  return <ClinicContext.Provider value={{ clinicId, selectClinic }}>
    {clinicId === 'withyou-clinic' ? withyou : <GoldmanWorkspace />}
  </ClinicContext.Provider>;
}
