'use client';

import { BarChart3, MousePointerClick, Eye, Quote, FileDown, ArrowRight, CheckCircle2, Search, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchMetrics, type SearchImport } from '@/lib/search-console';
import { goldmanFindings } from '@/data/goldman-findings';

export function GoldmanDashboard({ report, loading, error, onSearch, onReport, onQuestions }: {
  report: SearchImport | null; loading: boolean; error: string;
  onSearch: () => void; onReport: () => void; onQuestions: () => void;
}) {
  const metrics = searchMetrics(report?.rows ?? []);
  const top = [...(report?.rows ?? [])].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 5);
  const maxClicks = Math.max(1, ...top.map(row => row.clicks));
  const unavailable = loading ? '확인 중' : error ? '확인 필요' : '자료 없음';
  const ready = !loading && !error && report;
  const panel = 'rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-[0_2px_10px_rgba(31,28,45,.025)] sm:p-6';
  const cards = [
    { label: '검색 클릭', value: ready ? metrics.clicks.toLocaleString() : unavailable, note: '가져온 자료에 포함된 클릭', icon: MousePointerClick, tone: 'bg-[#efecff] text-[#6653df]' },
    { label: '검색 노출', value: ready ? metrics.impressions.toLocaleString() : unavailable, note: '가져온 자료에 포함된 노출', icon: Eye, tone: 'bg-[#e8f7f1] text-[#218462]' },
    { label: '검색 클릭률', value: ready ? `${metrics.ctr.toFixed(2)}%` : unavailable, note: '클릭수를 노출수로 나눈 비율', icon: BarChart3, tone: 'bg-[#fff1e6] text-[#d77832]' },
    { label: 'AI 답변 인용률', value: '미측정', note: '실제 AI 답변을 별도로 수집해야 합니다', icon: Quote, tone: 'bg-[#e8f2ff] text-[#397ac5]' },
  ];

  return <div className="space-y-5">
    <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div><div className="mb-1 text-xs font-semibold text-[#7160dc]">골드만 검색 성과 · 진단 현황</div><h1 className="text-[26px] font-bold tracking-[-.035em] sm:text-[30px]">검색 데이터를 바탕으로 개선할 질문을 찾습니다</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#777381]">저장한 서치콘솔 자료와 공개 홈페이지 진단을 함께 확인하세요. Google 검색 성과와 AI 답변 인용은 각각 구분합니다.</p></div>
      <div className="flex shrink-0 flex-wrap gap-2"><Button onClick={onReport} className="bg-[#6957e8] hover:bg-[#5845d5]"><FileDown className="size-4" />진단 보고서</Button><Button onClick={onSearch} variant="outline"><Search className="size-4" />서치콘솔 분석</Button></div>
    </div>
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${error ? 'border-[#f1d2d5] bg-[#fff3f4]' : 'border-[#e4dcaa] bg-[#fffdf2]'}`} role={error ? 'alert' : 'status'}>
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f6e9a8] text-[#7c6411]"><BarChart3 className="size-5" /></div>
      <div className="min-w-0 flex-1"><div className="text-sm font-bold text-[#5a4a16]">{loading ? '저장된 검색 자료를 확인하고 있습니다' : error ? '검색 자료를 불러오지 못했습니다' : report ? '실제 검색 자료 저장됨 · AI 답변은 미측정' : '서치콘솔 자료를 가져오면 실제 검색 성과를 볼 수 있습니다'}</div><p className="mt-1 text-xs leading-5 text-[#766b43]">{error || (ready ? `${report.startDate} ~ ${report.endDate} · ${report.dimension === 'query' ? '검색어' : '페이지'} ${report.rows.length.toLocaleString()}개 · 가져온 행의 합계이며 서치콘솔 전체 실적과 다를 수 있습니다.` : '위드유와 골드만의 자료는 각각 보관됩니다. 검색어 또는 페이지 CSV를 가져올 수 있습니다.')}</p></div>
      <Button size="sm" variant="outline" onClick={onSearch} className="shrink-0">{report ? '저장 자료 보기' : '자료 가져오기'}<ArrowRight className="size-3.5" /></Button>
    </div>
    <section aria-label="골드만 주요 지표" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article className={panel} key={label}><div className="flex items-start justify-between gap-2"><div><h2 className="text-sm font-medium text-[#777381]">{label}</h2><p className="mt-1 text-xs leading-5 text-[#9a96a3]">{note}</p></div><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon className="size-4" /></span></div><div className="mt-5 text-[30px] font-bold leading-none tracking-[-.04em] tabular-nums">{value}</div><div className="mt-3 text-xs text-[#777381]">{label === 'AI 답변 인용률' ? '예시 수치 없이 측정 상태를 표시합니다' : ready ? '사용자 제공 CSV 기준' : '자료 확인 후 표시합니다'}</div></article>)}</section>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">
      <section className={panel}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">클릭이 많은 {report?.dimension === 'page' ? '페이지' : '검색어'}</h2><p className="mt-1 text-xs leading-5 text-[#8a8495]">저장한 자료의 상위 5개 · 기간 내 누적 클릭</p></div><Button variant="ghost" size="sm" onClick={onSearch}>전체 보기<ArrowRight className="size-3.5" /></Button></div>
        {ready && top.length ? <div className="mt-6 space-y-6">{top.map(row => <div key={row.label}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="min-w-0 break-all font-medium">{row.label}</span><span className="shrink-0 font-semibold tabular-nums text-[#6957e8]">{row.clicks.toLocaleString()}회</span></div><div className="h-2.5 rounded-full bg-[#f0edf8]" aria-hidden="true"><div className="h-2.5 rounded-full bg-[#7562e8]" style={{ width: `${row.clicks / maxClicks * 100}%` }} /></div></div>)}</div> : <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center"><Search className="size-8 text-[#aaa1cf]" /><p className="text-sm text-[#777381]">{loading ? '검색 자료를 확인하고 있습니다.' : error ? '서치콘솔 분석에서 다시 확인해 주세요.' : '저장된 검색 자료가 없습니다.'}</p><Button variant="outline" onClick={onSearch}>서치콘솔 분석 열기</Button></div>}
        <p className="mt-6 border-t pt-4 text-xs leading-5 text-[#8a8495]">현재 파일에는 날짜별 추이가 없습니다. 이 그래프는 기간 전체의 클릭을 비교합니다.</p>
      </section>
      <section className={panel}><h2 className="font-bold">진단 진행 현황</h2><p className="mt-1 text-xs text-[#8a8495]">공개 홈페이지 표본과 실제 검색 자료</p><div className="mt-6 space-y-5">{[
        ['홈페이지 표본 점검', 'HTML 7개 · 수집 설정 파일 3개', '확인됨'],
        ['서치콘솔 검색 자료', ready ? `${report.rows.length.toLocaleString()}개 ${report.dimension === 'query' ? '검색어' : '페이지'}` : '사용자 제공 CSV로 확인', ready ? '저장됨' : unavailable],
        ['AI 답변 언급·인용', '모델별 실제 답변 수집 필요', '미측정'],
        ['홈페이지 전체 검사', '현재는 일부 페이지 표본', '추가 확인'],
      ].map(([label, note, state]) => <div className="border-b pb-4 last:border-0" key={label}><div className="flex items-start justify-between gap-2 text-sm"><strong className="font-medium">{label}</strong><span className="shrink-0 text-xs font-semibold text-[#6957e8]">{state}</span></div><p className="mt-1.5 text-xs leading-5 text-[#8a8495]">{note}</p></div>)}</div><div className="mt-3 rounded-xl bg-[#f7f4ff] p-4 text-xs leading-6 text-[#736485]">두 병원은 같은 화면 구조를 사용하며, 데이터와 진단 범위는 병원별로 구분합니다.</div></section>
    </div>
    <section className={panel}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">공개 홈페이지에서 확인한 개선 항목</h2><Button variant="ghost" size="sm" onClick={onReport}>근거와 보고서 보기<ArrowRight className="size-3.5" /></Button></div><div className="grid gap-4 lg:grid-cols-3">{goldmanFindings.slice(0, 3).map((finding, index) => <article className="rounded-xl border border-[#ece8f3] p-4" key={finding.id}><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#6957e8]">{index === 2 ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}{finding.priority}</div><h3 className="font-semibold leading-6">{finding.title}</h3><p className="mt-2 text-sm leading-6 text-[#777381]">{finding.observation}</p></article>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><p className="text-sm text-[#777381]">기존 의료정보를 환자가 묻는 질문과 연결해 보세요.</p><Button variant="outline" onClick={onQuestions}>환자 질문 활용안 보기<ArrowRight className="size-4" /></Button></div></section>
  </div>;
}
