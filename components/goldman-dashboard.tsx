'use client';

import { ArrowRight, BarChart3, Check, Database, Eye, FileDown, MousePointerClick, Quote, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Metric } from '@/components/dashboard-primitives';
import { JourneyStrip } from '@/components/question-views';
import { searchMetrics, type SearchImport } from '@/lib/search-console';
import type { Opportunity, QuestionSet } from '@/lib/question-opportunities';
import type { WorkspaceView } from '@/lib/workspace-navigation';
import audit from '@/data/goldman-audit.json';
import { goldmanFindings } from '@/data/goldman-findings';

export function GoldmanDashboard({ report, loading, error, items, questionSet, questionLoading, questionError, questionDescription, onNavigate, onBrief }: {
  report: SearchImport | null; loading: boolean; error: string; items: Opportunity[]; questionSet: QuestionSet | null;
  questionLoading: boolean; questionError: string; questionDescription: string;
  onNavigate: (view: WorkspaceView) => void; onBrief: (question: string) => void;
}) {
  const ready = !loading && !error && report;
  const metrics = searchMetrics(ready ? report.rows : []);
  const unavailable = loading ? '확인 중' : error ? '확인 필요' : '자료 없음';
  const period = ready ? `${report.startDate} ~ ${report.endDate} · 가져온 행의 합계` : '자료 확인 후 표시합니다';
  const questionsReady = !questionLoading && !questionError && !!questionSet?.source;
  const steps = [
    ['공식 홈페이지 표본 재진단', '완료', true, `${audit.checkedDate} · HTML ${audit.pages.length}개`],
    ['기술 구성·개선 항목 정리', '완료', true, '수집 설정 4개 · 우선 검토 4개'],
    ['Search Console CSV 확보', ready ? '저장됨' : unavailable, !!ready, ready ? `${report.rows.length.toLocaleString()}개 ${report.dimension === 'query' ? '검색어' : '페이지'}` : 'Google 계정 직접 연결은 별도'],
    ['검색어 기반 질문 기획', questionLoading ? '확인 중' : questionError ? '확인 필요' : questionsReady ? '자료 반영' : '초기 제안', questionsReady, questionDescription],
    ['병원 담당자·의료진 검수', '진행 필요', false, '비용·치료 설명·지점 운영 확인'],
    ['AI 답변 기준선 수집', '미측정', false, '같은 질문과 모델 조건으로 실측 필요'],
    ['콘텐츠 승인·홈페이지 발행', '대기', false, '발행 계획 저장과 실제 게시를 구분'],
  ] as const;
  return <>
    <Heading eyebrow={`골드만 온보딩 · ${audit.checkedDate}`} title="골드만 공식 홈페이지를 다시 진단했습니다" description={audit.summary} action={<Button className="bg-[#6957e8] hover:bg-[#5845d5]" onClick={() => onNavigate('report')}><FileDown className="size-4" />진단 결과·근거 보기</Button>} />
    <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="검색 클릭" value={ready ? metrics.clicks.toLocaleString() : unavailable} unit={ready ? '회' : ''} note={period} icon={MousePointerClick} tone="bg-[#efecff] text-[#6653df]" />
      <Metric label="검색 노출" value={ready ? metrics.impressions.toLocaleString() : unavailable} unit={ready ? '회' : ''} note="Search Console 전체 실적과 다를 수 있습니다" icon={Eye} tone="bg-[#e8f7f1] text-[#218462]" />
      <Metric label="검색 클릭률" value={ready ? metrics.ctr.toFixed(2) : unavailable} unit={ready ? '%' : ''} note="가져온 행의 클릭 ÷ 노출" icon={BarChart3} tone="bg-[#fff1e6] text-[#d77832]" />
      <Metric label="AI 답변 인용률" value="미측정" unit="" note="검색 실적만으로 AI 인용을 판단하지 않습니다" icon={Quote} tone="bg-[#e8f2ff] text-[#397ac5]" />
    </section>
    {error && <p role="alert" className="mb-5 rounded-xl bg-[#fff3f4] p-4 text-sm text-[#a73848]">{error}</p>}
    {questionError && <p role="alert" className="mb-5 rounded-xl bg-[#fff3f4] p-4 text-sm text-[#a73848]">질문 자료 확인 필요: {questionError} 아래 질문은 마지막 확보 자료 또는 초기 제안이며, 최신 자료로 확인되지 않았습니다.</p>}
    {questionLoading && <p role="status" className="mb-5 text-xs text-[#8f8b98]">질문 자료를 확인하고 있습니다. 아래 질문은 확인 전 자료입니다.</p>}
    <section className="mb-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-[15px] font-bold">실서비스 시작 단계</h2><p className="mt-1 text-xs text-[#9692a0]">검색 자료와 홈페이지 진단에서 첫 콘텐츠로 이어갑니다.</p></div><span className="rounded-full bg-[#f0edff] px-2.5 py-1 text-[10px] font-bold text-[#5d49d2]">{steps.filter(step => step[2]).length} / 7 완료</span></div><div className="space-y-2">{steps.map(([title, status, done, detail], index) => <div key={title} className="flex items-center gap-3 rounded-xl border border-[#eceaf1] px-3.5 py-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${done ? 'bg-[#e8f7f1] text-[#218462]' : 'bg-[#f1eff5] text-[#8b8794]'}`}>{done ? <Check className="size-3.5" /> : index + 1}</span><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{title}</div><div className="mt-0.5 text-[10px] text-[#9894a1]">{detail}</div></div><span className={`shrink-0 text-[10px] font-bold ${done ? 'text-[#258967]' : 'text-[#9a96a3]'}`}>{status}</span></div>)}</div><Button variant="outline" className="mt-4 w-full" onClick={() => onNavigate('settings')}>다음 연결 확인하기<ArrowRight className="size-4" /></Button></div>
      <div className="overflow-hidden rounded-2xl border border-[#efdadd] bg-white"><div className="border-b border-[#f2e5e7] bg-[#fff8f8] px-5 py-4 sm:px-6"><div className="flex items-center gap-2 text-[#bc4c57]"><ShieldAlert className="size-4" /><h2 className="text-[15px] font-bold">먼저 확인할 데이터</h2></div><p className="mt-1 text-xs text-[#8f7d80]">현재 홈페이지에서 확인한 검토 항목입니다.</p></div><div className="divide-y divide-[#f2eaeb]">{goldmanFindings.map(finding => <button key={finding.id} onClick={() => onNavigate('report')} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-[#fffafa] sm:px-6"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff0f1] text-[#c75161]"><TriangleAlert className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{finding.title}</span><span className="mt-1 block text-[10px] leading-4 text-[#9692a0]">{finding.observation}</span></span><span className="shrink-0 text-[10px] font-bold text-[#bc4c57]">{finding.priority}</span></button>)}</div></div>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]"><div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-[15px] font-bold">환자 질문 여정 초안</h2><p className="mt-1 text-xs text-[#9692a0]">질문 단계별 비중이며 AI 점수가 아닙니다.</p></div><button onClick={() => onNavigate('journey')} className="text-xs font-semibold text-[#6957e8]">전체 보기</button></div><JourneyStrip compact items={items} /></div>
      <div className="rounded-2xl bg-[#282534] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><div><div className="text-[10px] font-semibold tracking-[.1em] text-[#aaa3bd]">FIRST CONTENT BRIEF</div><h2 className="mt-1 text-[17px] font-bold">기존 문서 보완부터 시작하세요</h2></div><Sparkles className="size-5 text-[#a99bff]" /></div><p className="mt-4 text-xs leading-5 text-white/65">새 검색어로 주제를 고르고, 의료정보 문서와의 중복을 확인합니다. 골드만의 전체 원고는 아직 작성되지 않았습니다.</p>{items[0] ? <button onClick={() => onBrief(items[0].question)} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-white/[.075] p-3 text-left hover:bg-white/[.12]"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#7562e8] text-xs font-bold">01</span><span className="flex-1 text-xs font-semibold leading-5">{items[0].question}</span><ArrowRight className="size-4 text-white/45" /></button> : <p className="mt-4 text-xs text-white/65">최근 검색 자료에서 질문 후보를 확인해 주세요.</p>}<div className="mt-3 flex items-center gap-2 text-[10px] text-white/50"><ShieldCheck className="size-3.5" />의료진 검수 전에는 발행하지 않습니다.</div></div>
    </section>
    <section className="mt-5 grid gap-4 lg:grid-cols-3">{audit.rechecked.map(item => <article key={item.title} className="rounded-2xl border border-[#cfe9df] bg-[#eff9f4] p-5"><div className="flex items-center gap-2 text-[#247c5e]"><ShieldCheck className="size-4" /><h2 className="text-sm font-bold">{item.title}</h2></div><p className="mt-3 text-xs leading-6 text-[#537064]">{item.now}</p></article>)}</section>
  </>;
}
