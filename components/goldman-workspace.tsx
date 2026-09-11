'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, FileDown, Search, CalendarDays, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { GoldmanDashboard } from '@/components/goldman-dashboard';
import { BarChart3, Database, Map, Settings } from 'lucide-react';
import type { SearchImport } from '@/lib/search-console';
import { Button } from '@/components/ui/button';
import { PublishingScheduler } from '@/components/publishing-scheduler';
import { SearchConsolePanel } from '@/components/search-console-panel';
import { goldmanQuestions } from '@/lib/clinics';
import audit from '@/data/goldman-audit.json';
import { goldmanFindings } from '@/data/goldman-findings';

type View = 'overview' | 'questions' | 'search' | 'plan' | 'report' | 'knowledge' | 'settings';
const tabs = [
  { id: 'overview', label: '진단 대시보드', icon: BarChart3 },
  { id: 'questions', label: '환자 질문 지도', icon: Map },
  { id: 'plan', label: '콘텐츠 발행 계획', icon: CalendarDays },
  { id: 'report', label: '진단 보고서', icon: FileDown },
  { id: 'search', label: '서치콘솔 분석', icon: Search },
] as const;
const panel = 'rounded-2xl border border-[#e5e1ef] bg-white p-5 sm:p-7';

function SourceLink({ label, url }: { label: string; url: string }) {
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-xs font-semibold text-[#6957e8] underline-offset-4 hover:underline">{label}<ArrowUpRight className="size-3.5" /></a>;
}

function downloadReport() {
  const content = [
    '# 골드만 비뇨의학과 AEO 공개 홈페이지 진단',
    `진단일: ${audit.checkedDate}\n대상: https://www.gold-man.com/\n범위: ${audit.scope}`,
    '## 결론\n질문형 의료정보와 검색 수집의 기본 구성은 존재합니다. 병원 정보의 일관성, 치료 설명의 균형, 사이트맵 관리부터 개선할 수 있습니다.',
    '## 직접 확인한 기술 항목\n표본 HTML 7개 모두 HTTP 200, 설명 메타 태그, 대표 URL(canonical), 구조화 데이터(JSON-LD)가 확인됐습니다. 표본 응답에서 noindex 지시가 발견되지 않았습니다. 구조화 데이터 유효성·색인 여부·실제 AI 인용은 별도 확인해야 합니다.',
    ...goldmanFindings.map((finding,index) => `## ${index+1}. ${finding.title}\n관찰: ${finding.observation}\n의미: ${finding.implication}\n실행: ${finding.action}\n담당: ${finding.owner}\n근거:\n${finding.sources.map(source=>`- [${source.label}](${source.url})`).join('\n')}`),
    '## 활용할 환자 질문\n다음 질문은 공개 홈페이지에서 착안한 콘텐츠 기획 제안이며, 검색량이나 AI 추천 횟수의 실측값이 아닙니다. 연결 문서는 의료정보 홈에서 확인한 링크이며 전체 본문 검토는 별도로 필요합니다.',
    ...goldmanQuestions.map(q=>`- ${q.question}\n  ${q.action}\n  https://www.gold-man.com${q.path}`),
    '## 측정 계획\n서치콘솔에서 같은 검색 유형·필터·길이의 기간으로 조회해 개선 전후를 비교하세요. 검색어/페이지 CSV 가져오기는 사용자 제공 파일을 분석하며 계정 직접 연결을 의미하지 않습니다. 클릭·노출 합계는 가져온 행 범위에 한정합니다.',
    '## 확인 범위와 제한\n수동 표본 진단입니다. 전체 사이트 크롤링, Google 계정 확인, URL 검사, AI 답변 인용률 측정은 수행하지 않았습니다. 정량 AEO 점수나 성과 향상률을 산정하지 않았습니다. 의료 내용은 담당 의료진이 검토해야 합니다.',
    `## 점검한 URL\n${[...audit.pages,...audit.resources].map(page=>`- ${page.name}: ${page.url} (HTTP ${page.status})`).join('\n')}`,
  ].join('\n\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF',content], {type:'text/markdown;charset=utf-8'}));
  const link = document.createElement('a'); link.href=url; link.download=`골드만_AEO_진단_${audit.checkedDate}.md`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function GoldmanWorkspace() {
  const [view,setView] = useState<View>('overview');
  const [selectedQuestion,setSelectedQuestion] = useState(0);
  const [searchReport, setSearchReport] = useState<SearchImport | null>(null);
  const [searchLoading, setSearchLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/search-console-imports?clinicId=goldman-clinic', { signal: controller.signal })
      .then(async response => {
        const data = await response.json() as { report: SearchImport | null; error?: string };
        if (!response.ok) throw new Error(data.error || '검색 자료를 불러오지 못했습니다.');
        if (!controller.signal.aborted) { setSearchReport(data.report); setSearchError(''); }
      })
      .catch(error => { if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : '검색 자료를 불러오지 못했습니다.'); })
      .finally(() => { if (!controller.signal.aborted) setSearchLoading(false); });
    return () => controller.abort();
  }, [view]);
  const importStatus = searchLoading ? '검색 자료 확인 중' : searchError ? '검색 자료 확인 필요' : searchReport ? '서치콘솔 자료 저장됨' : '서치콘솔 자료 없음';
  return <WorkspaceShell<View>
    active={view} onSelect={setView} workflowItems={tabs}
    hospitalItems={[{ id: 'knowledge', label: '병원 지식 베이스', icon: Database }, { id: 'settings', label: '연동 및 설정', icon: Settings }]}
    status={`${importStatus} · AI 답변 미측정`}
    onHelp={() => setView('settings')} onAlerts={() => setView('report')}
    sidebarFooter={<><div className="mb-3 flex items-center gap-2"><ShieldCheck className="size-4 text-[#b9adff]" /><span className="text-xs font-semibold">진단 범위를 확인하세요</span></div><div className="text-lg font-bold">공개 페이지 7개</div><p className="mt-2 text-xs leading-5 text-white/60">표본 진단과 실제 검색 자료를 구분합니다. AI 언급·인용률은 아직 측정하지 않았습니다.</p></>}
  >
      {view === 'overview' && <GoldmanDashboard report={searchReport} loading={searchLoading} error={searchError} onSearch={() => setView('search')} onReport={() => setView('report')} onQuestions={() => setView('questions')} />}
      {view === 'knowledge' && <section className="space-y-6"><div><div className="mb-1 text-xs font-semibold text-[#7160dc]">골드만 공식 홈페이지 · {audit.checkedDate}</div><h1 className="text-[30px] font-bold tracking-[-.035em]">병원 지식 베이스</h1><p className="mt-2 text-sm leading-6 text-[#777381]">진단에 사용한 공개 페이지와 수집 설정 파일입니다. 최신 정보와 의료 표현은 병원 담당자가 확인해야 합니다.</p></div><div className="grid gap-4 md:grid-cols-2">{[...audit.pages, ...audit.resources].map(source => <article className={panel} key={source.url}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">{source.name}</h2><span className="shrink-0 rounded-full bg-[#e8f7f1] px-2.5 py-1 text-xs text-[#218462]">HTTP {source.status}</span></div><SourceLink label={source.url} url={source.url} /></article>)}</div></section>}
      {view === 'settings' && <section className="space-y-6"><div><div className="mb-1 text-xs font-semibold text-[#7160dc]">골드만 데이터 연결</div><h1 className="text-[30px] font-bold tracking-[-.035em]">연동 및 설정</h1><p className="mt-2 text-sm leading-6 text-[#777381]">현재 연결 상태와 다음에 확보할 자료를 확인합니다.</p></div><div className="grid gap-5 lg:grid-cols-2"><article className={panel}><Search className="size-6 text-[#6957e8]" /><h2 className="mt-4 text-lg font-bold">Google Search Console</h2><p className="mt-3 font-medium text-[#6957e8]">{importStatus}</p><p className="mt-2 text-sm leading-6 text-[#777381]">사용자가 가져온 CSV로 검색 지표를 계산합니다. Google 계정을 직접 연결하거나 실적을 자동 갱신하지 않습니다.</p>{searchError && <p role="alert" className="mt-3 text-sm text-[#a73848]">{searchError}</p>}<Button className="mt-5 bg-[#6957e8] hover:bg-[#5845d5]" onClick={() => setView('search')}>서치콘솔 자료 관리<ArrowRight className="size-4" /></Button></article><article className={panel}><Activity className="size-6 text-[#6957e8]" /><h2 className="mt-4 text-lg font-bold">AI 답변 · 추천 방문</h2><p className="mt-3 font-medium text-[#777381]">아직 연결하지 않았습니다</p><p className="mt-2 text-sm leading-6 text-[#777381]">AI 답변의 언급·인용은 응답 원문을 수집한 뒤 측정해야 합니다. 추천 방문과 예약 효과는 별도의 방문·전환 자료가 필요합니다.</p><div className="mt-5 rounded-xl bg-[#f7f4ff] p-4 text-sm leading-6 text-[#736485]">서치콘솔 CSV만으로 AI 인용률이나 예약 증가를 계산하지 않습니다.</div></article></div></section>}
      {view==='questions' && <section className="space-y-6"><div><h1 className="text-2xl font-bold">환자의 질문을 기존 정보와 연결합니다</h1><p className="mt-3 text-sm leading-6 text-[#777381]">의료정보 홈에서 확인한 링크를 바탕으로 만든 기획 제안입니다. 실제 검색량이나 AI 추천 횟수로 선정한 순위는 아닙니다.</p></div><div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]"><div className="space-y-3">{goldmanQuestions.map((question,index)=><button key={question.path} onClick={()=>setSelectedQuestion(index)} aria-pressed={index===selectedQuestion} className={`w-full rounded-xl border bg-white p-5 text-left ${index===selectedQuestion?'border-[#8e7adf] ring-2 ring-[#ebe5ff]':'border-[#e5e1ef]'}`}><span className="text-xs font-semibold text-[#6957e8]">{question.intent}</span><div className="mt-2 font-semibold leading-6">{question.question}</div></button>)}</div><div className={`${panel} self-start`}><span className="text-xs font-semibold text-[#6957e8]">콘텐츠 개선 브리프 · 의료진 검토 전</span><h2 className="mt-3 text-xl font-bold leading-8">{goldmanQuestions[selectedQuestion].question}</h2><p className="my-4 text-sm leading-7 text-[#777381]">{goldmanQuestions[selectedQuestion].action}</p><SourceLink label="기존 관련 페이지 열기" url={`https://www.gold-man.com${goldmanQuestions[selectedQuestion].path}`} /><ol className="mt-6 list-decimal space-y-4 border-t pt-5 pl-5 text-sm leading-6 text-[#625a70]"><li>첫 문단에 질문의 직접적인 답변을 작성합니다. 치료 내용은 담당 의료진이 확인합니다.</li><li>적용 대상·예외·개인차를 나누고, 작성자·검토일·참고 근거를 표시합니다.</li><li>관련 진료 설명과 지점 안내로 연결하고, 변경한 URL과 날짜를 기록합니다.</li><li>같은 조건의 서치콘솔 기간을 비교해 클릭·노출 변화를 확인합니다.</li></ol><Button className="mt-6 bg-[#6957e8] hover:bg-[#5845d5]" onClick={()=>setView('plan')}>질문 목록으로 발행 계획 세우기 <ArrowRight className="size-4" /></Button><p className="mt-3 text-xs leading-5 text-[#948ba0]">자동으로 의료 원고를 작성하거나 게시하는 기능은 아닙니다.</p></div></div></section>}
      {view==='search' && <SearchConsolePanel key="goldman-clinic" clinicId="goldman-clinic" onSaved={report => { setSearchReport(report); setSearchError(''); setSearchLoading(false); }} />}
      {view==='plan' && <section><h1 className="mb-3 text-2xl font-bold">골드만 콘텐츠 발행 계획</h1><p className="mb-6 text-sm leading-6 text-[#777381]">공개 사이트에서 도출한 질문 5개로 시작합니다. 골드만 일정은 위드유 일정과 별도로 저장됩니다.</p><PublishingScheduler key="goldman-clinic" clinicId="goldman-clinic" onOpenSettings={()=>setView('search')} /></section>}
      {view==='report' && <section className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-sm font-semibold text-[#6957e8]">{audit.checkedDate} · 공개 홈페이지 진단</span><h1 className="mt-2 text-2xl font-bold">골드만 AEO 진단 보고서</h1><p className="mt-2 text-sm leading-6 text-[#777381]">{audit.scope}</p></div><Button onClick={downloadReport} variant="outline"><FileDown className="size-4" />보고서 내려받기 (.md)</Button></div><div className="rounded-2xl border border-[#d8eadf] bg-[#f1f8f4] p-6"><div className="flex items-center gap-2 font-bold text-[#267356]"><ShieldCheck className="size-5" />이미 갖춘 기반</div><p className="mt-3 text-sm leading-7 text-[#537064]">확인한 HTML 7개 모두 정상 응답(HTTP 200), 설명 메타 태그, 대표 URL(canonical), 구조화 데이터(JSON-LD)가 있습니다. 응답에서 noindex 지시도 발견되지 않았습니다. 이는 표본의 구성 확인이며 구조화 데이터 검증이나 실제 검색 색인 확인을 의미하지 않습니다.</p></div><div className="grid gap-5 lg:grid-cols-2">{goldmanFindings.map((finding,index)=><article className={panel} key={finding.id}><span className="rounded-full bg-[#f1edfc] px-3 py-1.5 text-xs font-semibold text-[#6957e8]">{String(index+1).padStart(2,'0')} · {finding.priority}</span><h2 className="mt-4 text-lg font-bold leading-7">{finding.title}</h2><p className="mt-3 text-sm leading-7 text-[#70667e]">{finding.observation}</p><p className="mt-3 text-sm leading-6 text-[#928799]">{finding.implication}</p><div className="mt-4 rounded-xl bg-[#f8f6fb] p-4 text-sm leading-7"><strong className="block text-[#625175]">권장 실행</strong>{finding.action}</div><div className="mt-3 text-xs text-[#948a9e]">담당: {finding.owner}</div><div className="mt-4 flex flex-wrap gap-3">{finding.sources.map(source=><SourceLink key={source.url} {...source} />)}</div></article>)}</div><section className={panel}><h2 className="text-lg font-bold">확인한 URL과 관찰값</h2><div className="mt-4 overflow-auto"><table className="w-full min-w-[610px] text-left text-sm"><thead className="text-xs text-[#8d8199]"><tr><th className="py-3">페이지</th><th>응답</th><th>설명</th><th>대표 URL</th><th>구조화 데이터</th></tr></thead><tbody>{audit.pages.map(page=><tr className="border-t" key={page.url}><td className="py-3"><SourceLink label={page.name} url={page.url} /></td><td>{page.status}</td><td>있음</td><td>있음</td><td>{page.structuredDataBlocks}개 블록</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-4 border-t pt-4">{audit.resources.map(source=><SourceLink key={source.url} label={source.name} url={source.url} />)}</div></section><div className="rounded-xl bg-[#eeeaf5] p-5 text-sm leading-7 text-[#796c88]">이 보고서는 수동 표본 진단입니다. 전체 사이트 크롤링, Google 계정 확인, URL 검사, AI 답변 인용률 측정은 수행하지 않았습니다. 점수나 성과 향상률을 임의로 산정하지 않았으며, 공개 페이지의 정보는 이후 변경될 수 있습니다.</div></section>}
      <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[#e5dfec] pt-5 text-xs leading-5 text-[#948a9f]"><span>위드유와 골드만의 자료·일정·검색 분석은 각각 보관됩니다.</span><span>공개 홈페이지 진단일 {audit.checkedDate}</span></footer>
  </WorkspaceShell>;
}
