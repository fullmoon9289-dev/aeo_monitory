'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Bot, Database, ExternalLink, FileText, LockKeyhole, Search, Settings, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { GoldmanDashboard } from '@/components/goldman-dashboard';
import { GoldmanPerformance } from '@/components/goldman-performance';
import { GoldmanReport } from '@/components/goldman-report';
import { Heading } from '@/components/dashboard-primitives';
import { JourneyView, OpportunitiesView } from '@/components/question-views';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublishingScheduler } from '@/components/publishing-scheduler';
import { SearchConsolePanel } from '@/components/search-console-panel';
import { goldmanQuestions } from '@/lib/clinics';
import { workflowNavigation, type WorkspaceView } from '@/lib/workspace-navigation';
import { stageForQuery, questionSetDescription, type Opportunity } from '@/lib/question-opportunities';
import type { SearchImport } from '@/lib/search-console';
import { useQuestionSet } from '@/hooks/use-question-set';
import audit from '@/data/goldman-audit.json';
import { goldmanFindings } from '@/data/goldman-findings';
import { useGa4 } from '@/hooks/use-ga4';
import { Ga4Connection } from '@/components/ga4-connection';

const panel = 'rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6';
const initialQuestions: Opportunity[] = goldmanQuestions.map((item, index) => ({ priority: index + 1, question: item.question, stage: stageForQuery(item.question), reason: item.action, evidence: '공식 웹 표본', risk: '의료진 검수', demand: '미측정' }));

function SourceLink({ label, url }: { label: string; url: string }) {
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-xs font-semibold text-[#6957e8] underline-offset-4 hover:underline">{label}<ExternalLink className="size-3.5 shrink-0" /></a>;
}

export function GoldmanWorkspace() {
  const [view, setView] = useState<WorkspaceView>('performance');
  const ga4 = useGa4(view === 'performance' || view === 'settings');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const questionData = useQuestionSet('goldman-clinic', view);
  const questions = questionData.questionSet?.source ? questionData.questionSet.items : initialQuestions;
  const selected = questions.find(item => item.question === selectedQuestion);
  const description = questionSetDescription(questionData.questionSet, questionData.loading, questionData.error);
  const [searchReport, setSearchReport] = useState<SearchImport | null>(null);
  const [searchLoading, setSearchLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    if (['command', 'performance', 'journey', 'opportunities', 'studio', 'monitor', 'report', 'search-console', 'knowledge', 'settings'].includes(requested ?? '')) setView(requested as WorkspaceView);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setSearchLoading(true);
    fetch('/api/search-console-imports?clinicId=goldman-clinic', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const data = await response.json() as { report: SearchImport | null; error?: string };
        if (!response.ok) throw new Error(data.error || '검색 자료를 불러오지 못했습니다.');
        if (!controller.signal.aborted) { setSearchReport(data.report); setSearchError(''); }
      })
      .catch(error => { if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : '검색 자료를 불러오지 못했습니다.'); })
      .finally(() => { if (!controller.signal.aborted) setSearchLoading(false); });
    return () => controller.abort();
  }, [view]);
  function navigate(next: WorkspaceView) {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.replaceState(null, '', url);
  }
  function openBrief(question: string) { setSelectedQuestion(question); navigate('studio'); }
  const importStatus = searchLoading ? '검색 자료 확인 중' : searchError ? '검색 자료 확인 필요' : searchReport ? '서치콘솔 CSV 저장됨' : '서치콘솔 자료 없음';
  return <WorkspaceShell<WorkspaceView>
    active={view} onSelect={navigate} workflowItems={workflowNavigation(questions.length)}
    hospitalItems={[{ id: 'knowledge', label: '병원 지식 베이스', icon: Database, badge: audit.pages.length + audit.resources.length }, { id: 'settings', label: '연동 및 설정', icon: Settings }]}
    status={`${importStatus} · AI 답변 미측정`} onHelp={() => navigate('settings')} onAlerts={() => navigate('report')}
    sidebarFooter={<><div className="mb-3 flex items-center justify-between"><ShieldCheck className="size-4 text-[#b9adff]" /><Badge className="bg-[#3d394d] text-[9px] text-white">SAFETY FIRST</Badge></div><div className="text-xs font-semibold">병원·의료진 검토 항목</div><div className="mt-2 flex items-baseline gap-1.5"><span className="text-2xl font-bold">{goldmanFindings.length}</span><span className="text-[10px] text-white/55">개 항목</span></div><p className="mt-2 text-[10px] leading-4 text-white/60">공개 홈페이지 관찰입니다. 의료진 승인 전 콘텐츠를 발행하지 않습니다.</p></>}
  >
    {view === 'command' && <GoldmanDashboard report={searchReport} loading={searchLoading} error={searchError} items={questions} questionSet={questionData.questionSet} questionLoading={questionData.loading} questionError={questionData.error} questionDescription={description} onNavigate={navigate} onBrief={openBrief} />}
    {view === 'performance' && <GoldmanPerformance report={searchReport} loading={searchLoading} error={searchError} onNavigate={navigate} ga4={ga4} />}
    {view === 'journey' && <JourneyView clinicName="골드만" items={questions} description={description} questionSet={questionData.questionSet} onNavigate={navigate} onBrief={openBrief} />}
    {view === 'opportunities' && <OpportunitiesView items={questions} description={description} questionSet={questionData.questionSet} onBrief={openBrief} />}
    {view === 'search-console' && <SearchConsolePanel key="goldman-clinic" clinicId="goldman-clinic" onSaved={report => { setSearchReport(report); setSearchError(''); setSearchLoading(false); }} />}
    {view === 'report' && <GoldmanReport report={searchReport} loading={searchLoading} error={searchError} onBack={() => navigate('command')} />}
    {view === 'studio' && <>
      <Heading eyebrow="Medical Content Studio" title="골드만의 질문을 의료진 검수 가능한 원고로 준비합니다" description="현재는 질문 기획과 발행 일정 저장 단계입니다. 골드만 전체 원고·검수 승인·홈페이지 자동 게시 기능은 아직 제공하지 않습니다." action={<Badge className="bg-[#fff1e6] text-[#b76a20]">원고 작성 필요</Badge>} />
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">{['질문·근거 선택', '근거형 초안', '의료진 검수', 'CMS 발행'].map((step, index) => <div key={step} className={`rounded-2xl border p-4 ${index === 0 ? 'border-[#ded8fb] bg-[#f5f2ff]' : 'border-[#e8e6ee] bg-white'}`}><span className="grid size-6 place-items-center rounded-full bg-[#f0edff] text-[10px] font-bold text-[#6957e8]">{index + 1}</span><p className="mt-2 text-xs font-semibold">{step}</p></div>)}</div>
      <PublishingScheduler key="goldman-clinic" clinicId="goldman-clinic" onOpenSettings={() => navigate('settings')} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_.7fr]"><section className={panel}><div className="flex items-center gap-2 text-[#6957e8]"><FileText className="size-4" /><span className="text-xs font-bold">선택한 콘텐츠 기획</span></div><h2 className="mt-4 text-xl font-bold leading-8">{selectedQuestion || '먼저 환자 질문을 선택해 주세요'}</h2><p className="mt-3 text-sm leading-7 text-[#777381]">{selected?.reason || '성장 기회에서 질문을 선택하면 원고 작성 전에 확인할 기획을 여기에서 볼 수 있습니다.'}</p><div className="mt-5 rounded-xl border border-[#eadfcf] bg-[#fffaf2] p-5 text-sm leading-7 text-[#7b6d59]">이 질문의 전체 초안은 아직 없습니다. 기존 의료정보 문서를 찾아 중복을 확인하고, 비용·치료 설명은 병원 및 의료진 검토 후 작성해야 합니다.</div><div className="mt-5 flex flex-wrap gap-3"><Button variant="outline" onClick={() => navigate('opportunities')}>질문 선택하기<ArrowRight className="size-4" /></Button><SourceLink label="기존 의료정보 확인" url="https://www.gold-man.com/docs/" /></div></section><aside className={panel}><h2 className="text-sm font-bold">발행 상태</h2><div className="mt-4 space-y-2">{[['근거형 초안', '작성 필요'], ['의료진 승인', '대기'], ['홈페이지 연결', '연동 필요']].map(([label, status]) => <div key={label} className="flex justify-between gap-3 rounded-xl border border-[#eceaf0] p-3 text-xs"><span className="font-semibold">{label}</span><span className="text-[#9a96a3]">{status}</span></div>)}</div><Button disabled className="mt-4 w-full"><LockKeyhole className="size-4" />검수·연결 후 발행</Button><p className="mt-3 text-xs leading-6 text-[#8f8b98]">위드유 샘플의 본문·검색 제목·완료 상태를 골드만 원고로 복사하지 않습니다.</p></aside></div>
    </>}
    {view === 'monitor' && <>
      <Heading eyebrow="Visibility Baseline" title="골드만의 현재 기준선을 구분해서 확인합니다" description="홈페이지 공개 표본은 재진단했지만, AI 답변 기준선은 아직 수집하지 않았습니다. 성장 기회 질문과 성과 비교용 질문은 별도로 관리해야 합니다." action={<Button variant="outline" onClick={() => navigate('report')}>공개 웹 진단 보기</Button>} />
      <div className="grid gap-5 lg:grid-cols-2"><section className={panel}><h2 className="text-sm font-bold">공개 홈페이지 기준선</h2><p className="mt-3 text-sm leading-7 text-[#777381]">{audit.scope}</p><p className="mt-4 font-semibold text-[#6957e8]">직접 조회일 {audit.checkedDate}</p><SourceLink label="골드만 공식 홈페이지" url="https://www.gold-man.com/" /></section><section className={panel}><div className="flex items-center gap-2"><Bot className="size-5 text-[#6957e8]" /><h2 className="text-sm font-bold">AI 답변 기준선 · 미측정</h2></div><p className="mt-3 text-sm leading-7 text-[#777381]">질문 세트, 모델·검색 모드, 언어·지역, 반복 횟수를 먼저 정해야 합니다. 실제 답변 원문과 인용 주소 없이 언급률을 계산하지 않습니다.</p><Button variant="outline" className="mt-4" onClick={() => navigate('settings')}>연결 조건 확인</Button></section></div>
      <section className={`mt-5 ${panel}`}><h2 className="text-sm font-bold">초기 비교 질문 제안 · 아직 측정에 사용하지 않음</h2><p className="mt-2 text-xs leading-6 text-[#8f8b98]">아래는 공식 홈페이지 기반 초기 제안입니다. 검색어 기반 성장 기회가 갱신돼도 자동으로 측정 질문을 교체하지 않습니다.</p><div className="mt-4 divide-y">{goldmanQuestions.map(item => <div key={item.question} className="flex items-center justify-between gap-4 py-4 text-sm"><span>{item.question}</span><Badge variant="outline" className="shrink-0">미측정</Badge></div>)}</div></section>
    </>}
    {view === 'knowledge' && <>
      <Heading eyebrow={`Official Knowledge · ${audit.checkedDate}`} title="골드만 병원 지식 베이스" description="진단에 사용한 공식 페이지와 수집 설정입니다. 출처 확인은 임상 내용과 현재 병원 운영에 대한 승인 완료를 의미하지 않습니다." action={<Button variant="outline" onClick={() => navigate('report')}>검토 항목 보기</Button>} />
      <div className="grid gap-4 md:grid-cols-2">{[...audit.pages, ...audit.resources].map(source => <article className={panel} key={source.url}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-bold">{source.name}</h2><Badge className="bg-[#e8f7f1] text-[#218462]">HTTP {source.status}</Badge></div><SourceLink label={source.url} url={source.url} /><p className="mt-3 text-xs text-[#8f8b98]">공식 서버 응답 확인 · {audit.checkedDate}</p></article>)}</div>
    </>}
    {view === 'settings' && <>
      <Heading eyebrow="Connections & Settings" title="골드만의 실제 연결 상태를 확인합니다" description="Search Console에 등록된 것과 메디앤서의 자동 연결은 다릅니다. 현재 홈페이지 분석과 CSV 저장은 가능하며, 나머지 연결은 준비가 필요합니다." />
      <div className="grid gap-5 lg:grid-cols-2">{[
        { title: '공식 홈페이지', state: '공개 페이지 재진단 완료', text: audit.scope, icon: Database, action: () => navigate('report'), button: '진단 결과 보기' },
        { title: 'Google Search Console', state: importStatus, text: searchError || (searchReport ? `저장 자료: ${searchReport.startDate} ~ ${searchReport.endDate}. 계정을 직접 연결하거나 최신 실적을 자동 수집하지 않습니다.` : 'Google 계정의 속성과 읽기 권한 확인 후 직접 연결 기능이 필요합니다. 지금은 CSV를 가져올 수 있습니다.'), icon: Search, action: () => navigate('search-console'), button: '서치콘솔 자료 관리' },
        { title: 'AI 답변·추천 방문', state: '미연결 · 측정 기능 필요', text: '모델별 답변 원문과 방문 분석 자료를 수집해야 합니다. 검색어 CSV에서 AI 인용률이나 예약 증가를 추정하지 않습니다.', icon: Activity, action: () => navigate('performance'), button: '측정 상태 보기' },
        { title: '홈페이지 콘텐츠 발행', state: '미연결 · 원고 작성 전', text: '워드프레스는 필수가 아닙니다. 골드만 홈페이지 관리업체에 현재 게시 방식과 칼럼 등록 권한을 확인해야 합니다. 지금 저장되는 것은 발행 계획입니다.', icon: FileText, action: () => navigate('studio'), button: '콘텐츠 준비 보기' },
      ].map(({ title, state, text, icon: Icon, action, button }) => <article key={title} className={panel}><Icon className="size-6 text-[#6957e8]" /><h2 className="mt-4 text-lg font-bold">{title}</h2>{title === 'AI 답변·추천 방문' ? <Ga4Connection data={ga4} /> : <><p className="mt-3 text-sm font-semibold text-[#6957e8]">{state}</p><p className="mt-2 text-sm leading-7 text-[#777381]">{text}</p><Button variant="outline" className="mt-5" onClick={action}>{button}<ArrowRight className="size-4" /></Button></>}</article>)}</div>
    </>}
    <footer className="report-no-print mt-8 flex flex-wrap justify-between gap-3 border-t border-[#e5dfec] pt-5 text-xs leading-5 text-[#948a9f]"><span>병원별 자료·발행 일정은 분리해 보관됩니다.</span><span>공식 홈페이지 직접 재조회 {audit.checkedDate}</span></footer>
  </WorkspaceShell>;
}
