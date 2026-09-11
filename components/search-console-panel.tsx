'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileUp, Search, Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clinics, type ClinicId, validDate } from '@/lib/clinics';
import { maxCsvBytes, parseSearchCsv, searchMetrics, type SearchData, type SearchImport } from '@/lib/search-console';

type SearchConsolePanelProps = { clinicId: ClinicId; onSaved?: (report: SearchImport) => void };

export function SearchConsolePanel(props: SearchConsolePanelProps) {
  return <SearchConsolePanelContent key={props.clinicId} {...props} />;
}

function SearchConsolePanelContent({ clinicId, onSaved }: SearchConsolePanelProps) {
  const clinic = clinics[clinicId];
  const [saved, setSaved] = useState<SearchImport | null>(null);
  const [draft, setDraft] = useState<{ csv: string; filename: string; data: SearchData } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/search-console-imports?clinicId=${clinicId}`, { signal: controller.signal })
      .then(async response => { const data = await response.json() as { report: SearchImport | null; error?: string }; if (!response.ok) throw new Error(data.error); if (!controller.signal.aborted) setSaved(data.report); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '자료를 불러오지 못했습니다.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clinicId]);
  const displayed = draft?.data ?? saved;
  const metrics = useMemo(() => searchMetrics(displayed?.rows ?? []), [displayed]);
  const sorted = useMemo(() => [...(displayed?.rows ?? [])].sort((a, b) => b.impressions - a.impressions), [displayed]);
  const [limit, setLimit] = useState(15);
  const canSave = draft && confirmed && validDate(startDate) && validDate(endDate) && startDate <= endDate && endDate <= new Date().toISOString().slice(0, 10);

  async function pickFile(file?: File) {
    setError(''); setNotice(''); setDraft(null); setConfirmed(false); setLimit(15);
    if (!file) return;
    setReading(true);
    try {
      if (!file.name.toLowerCase().endsWith('.csv') || file.size > maxCsvBytes) throw new Error('1MB 이하의 CSV 파일을 선택해 주세요. ZIP은 압축을 풀어 주세요.');
      const csv = await file.text();
      const data = parseSearchCsv(csv);
      if (data.dimension === 'page' && data.rows.some(row => { const host = new URL(row.label).hostname; return host !== clinic.domain && !host.endsWith(`.${clinic.domain}`); })) throw new Error('다른 병원 도메인이 포함되어 있습니다. 선택한 병원과 파일을 확인해 주세요.');
      setDraft({ csv, filename: file.name, data });
    } catch (error) { setError(error instanceof Error ? error.message : '파일을 읽지 못했습니다.'); }
    finally { setReading(false); }
  }
  async function save() {
    if (!canSave || !draft) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/search-console-imports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clinicId, propertyUrl: clinic.url, propertyConfirmed: confirmed, startDate, endDate, csv: draft.csv, filename: draft.filename }) });
      const data = await response.json() as { report: SearchImport | null; error?: string }; if (!response.ok) throw new Error(data.error);
      setSaved(data.report); if (data.report) onSaved?.(data.report); setDraft(null); setConfirmed(false); setNotice(`${clinic.name}의 검색 분석을 저장했습니다.`);
    } catch (error) { setError(error instanceof Error ? error.message : '분석을 저장하지 못했습니다.'); }
    finally { setSaving(false); }
  }
  return <section className="space-y-6">
    <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6957e8]"><Search className="size-4" /> 실제 검색 데이터</div><h2 className="text-2xl font-bold">{clinic.name} 서치콘솔 분석</h2><p className="mt-2 text-sm leading-6 text-[#777381]">등록된 속성의 검색어 또는 페이지 CSV를 가져오세요. 자료는 이 병원의 공간에만 저장됩니다.</p></div>
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <div className="rounded-2xl border border-[#e5e1ef] bg-white p-5 sm:p-6">
        <h3 className="font-bold">서치콘솔에서 가져오는 순서</h3>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#625d70]"><li>속성에서 <strong className="text-[#292532]">{clinic.domain}</strong>을 선택합니다.</li><li>실적 → 검색결과에서 기간·검색 유형·필터를 설정합니다.</li><li>검색어 또는 페이지 탭을 선택하고 내보내기 → CSV를 누릅니다.</li><li>압축 파일이라면 풀어서 검색어(Queries) 또는 페이지(Pages) CSV를 선택합니다.</li></ol>
        <a className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#6957e8]" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">서치콘솔 열기 <ArrowUpRight className="size-4" /></a>
        <p className="mt-3 text-xs leading-5 text-[#777381]">CSV에는 계정 인증 정보가 없으므로 원본 속성을 자동 확인할 수 없습니다. 검색어 파일은 아래 확인란으로 직접 구분하고, 페이지 파일은 도메인도 검사합니다.</p>
      </div>
      <div className="rounded-2xl border border-[#e5e1ef] bg-white p-5 sm:p-6">
        <label htmlFor={`gsc-file-${clinicId}`} className="flex items-center gap-2 font-bold"><FileUp className="size-5 text-[#6957e8]" /> CSV 가져오기</label>
        <Input id={`gsc-file-${clinicId}`} type="file" accept=".csv,text/csv" disabled={saving || reading} className="mt-4 h-auto py-3 text-sm" onChange={event => { void pickFile(event.target.files?.[0]); event.target.value = ''; }} />
        <p className="mt-2 text-xs text-[#777381]">최대 1MB · 1,000행 · 한국어/영어 열 이름 지원</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><label htmlFor={`gsc-start-${clinicId}`} className="text-sm">조회 시작일<Input id={`gsc-start-${clinicId}`} aria-label="조회 시작일" type="date" value={startDate} max={endDate || undefined} onChange={event => setStartDate(event.target.value)} className="mt-2" /></label><label htmlFor={`gsc-end-${clinicId}`} className="text-sm">조회 종료일<Input id={`gsc-end-${clinicId}`} aria-label="조회 종료일" type="date" value={endDate} min={startDate || undefined} max={new Date().toISOString().slice(0, 10)} onChange={event => setEndDate(event.target.value)} className="mt-2" /></label></div>
        <p className="mt-2 text-xs leading-5 text-[#777381]">파일을 내려받을 때 서치콘솔에 표시된 기간을 입력하세요.</p>
        <label className="mt-4 flex items-start gap-2 text-sm leading-5"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 accent-[#6957e8]" />선택한 파일이 {clinic.name}의 위 기간 검색 자료임을 확인했습니다.</label>
        <div className="mt-4 flex flex-wrap gap-2"><Button disabled={!canSave || saving || reading} onClick={save} className="bg-[#6957e8] hover:bg-[#5845d5]">{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}분석 저장</Button>{draft && <Button variant="outline" disabled={saving} onClick={() => { setDraft(null); setError(''); }}>미리보기 닫기</Button>}</div>
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-[#fff0f1] p-4 text-sm text-[#a73848]">{error}</p>}
    {notice && <output className="block rounded-xl bg-[#eaf7f1] p-4 text-sm text-[#257452]">{notice}</output>}
    {loading || reading ? <output className="flex items-center gap-2 py-6 text-sm text-[#777381]"><Loader2 className="size-4 animate-spin" />{reading ? '파일을 분석하고 있습니다.' : '저장된 자료를 확인하고 있습니다.'}</output> : displayed ? <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold">{draft ? '가져온 파일 미리보기 · 아직 저장 전' : '저장된 검색 분석'}</h3><p className="mt-1 break-all text-sm text-[#777381]">{draft?.filename ?? saved?.filename} · {displayed.rows.length.toLocaleString()}행{!draft && saved ? ` · ${saved.startDate} ~ ${saved.endDate}` : ''}</p></div><span className="rounded-full bg-[#ede9fc] px-3 py-1.5 text-xs font-semibold text-[#6957e8]">사용자 제공 CSV</span></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['클릭수',metrics.clicks.toLocaleString()],['노출수',metrics.impressions.toLocaleString()],['클릭률',`${metrics.ctr.toFixed(2)}%`],['평균 순위 (가중 추정)',metrics.position?.toFixed(1) ?? '—']].map(([label,value]) => <div className="rounded-xl border bg-white p-5" key={label}><div className="text-xs text-[#777381]">{label}</div><div className="mt-2 text-2xl font-bold tabular-nums">{value}</div></div>)}</div>
      <p className="text-xs leading-5 text-[#777381]">가져온 행만 합산한 값입니다. 검색어·페이지 단위 집계와 익명 처리된 검색어 때문에 서치콘솔 전체 합계와 다를 수 있습니다. 평균 순위는 노출수로 가중한 추정값입니다. AI 답변 인용률은 이 파일로 측정하지 않습니다. <a href="https://support.google.com/webmasters/answer/7576553?hl=ko" target="_blank" rel="noreferrer" className="underline">Google 집계 안내</a></p>
      <div className="overflow-auto rounded-xl border bg-white"><table className="w-full min-w-[630px] text-left text-sm"><caption className="border-b p-4 text-left font-semibold">노출이 많은 {displayed.dimension === 'query' ? '검색어' : '페이지'}부터 검토하세요</caption><thead className="bg-[#f9f8fc] text-xs text-[#777381]"><tr><th className="px-4 py-3">{displayed.dimension === 'query' ? '검색어' : '페이지'}</th><th className="px-4 py-3 text-right">클릭</th><th className="px-4 py-3 text-right">노출</th><th className="px-4 py-3 text-right">클릭률</th><th className="px-4 py-3 text-right">순위</th></tr></thead><tbody>{sorted.slice(0,limit).map(row => <tr key={row.label} className="border-t"><td className="max-w-[480px] break-words px-4 py-3">{row.label}</td><td className="px-4 py-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{row.impressions.toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{(row.impressions ? row.clicks / row.impressions * 100 : 0).toFixed(1)}%</td><td className="px-4 py-3 text-right tabular-nums">{row.position.toFixed(1)}</td></tr>)}</tbody></table></div>
      {sorted.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 25)}>검색 자료 더 보기 ({limit}/{sorted.length})</Button>}
      <div className="rounded-xl bg-[#f0edfb] p-5 text-sm leading-6 text-[#625878]"><strong>다음 활용:</strong> 노출이 충분하지만 클릭률이 낮은 검색어부터 제목과 첫 답변이 질문에 맞는지 확인하세요. 같은 검색 유형·필터·길이의 기간으로 개선 전후를 비교합니다. 클릭률 변화만으로 AI 노출 개선을 단정하지 않습니다.</div>
    </div> : <div className="rounded-2xl border border-dashed bg-white px-6 py-10 text-center"><Search className="mx-auto size-7 text-[#aaa1cf]" /><h3 className="mt-3 font-semibold">저장된 서치콘솔 데이터가 없습니다</h3><p className="mt-2 text-sm leading-6 text-[#777381]">{clinicId === 'goldman-clinic' ? '골드만의 등록 사실은 사용자에게 확인했습니다.' : '위드유의 서치콘솔 CSV를 별도로 가져올 수 있습니다.'}<br />현재 계정 직접 연결은 제공하지 않으며, CSV를 가져오면 실제 검색 수치를 확인할 수 있습니다.</p></div>}
  </section>;
}
