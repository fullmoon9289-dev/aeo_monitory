'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Hospital,
  Lightbulb,
  Map,
  Menu,
  MessageCircleQuestion,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  X,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type View = 'command' | 'journey' | 'opportunities' | 'studio' | 'monitor';

const visibilityData = [
  { day: '8/12', score: 42 },
  { day: '8/16', score: 46 },
  { day: '8/20', score: 44 },
  { day: '8/24', score: 55 },
  { day: '8/28', score: 61 },
  { day: '9/1', score: 64 },
  { day: '9/5', score: 72 },
  { day: '9/9', score: 78 },
];
const chartConfig = {
  score: { label: '추천 가시성', color: '#6957e8' },
} satisfies ChartConfig;

const journeySteps = [
  {
    label: '증상 탐색',
    example: '아침에 허리가 뻣뻣해요',
    coverage: 86,
    questions: 18,
    tone: '#3b82f6',
  },
  {
    label: '질환 확인',
    example: '허리디스크 초기증상',
    coverage: 72,
    questions: 14,
    tone: '#7c6aeb',
  },
  {
    label: '치료 비교',
    example: '주사치료와 도수치료 차이',
    coverage: 48,
    questions: 21,
    tone: '#e59b42',
  },
  {
    label: '비용·보험',
    example: '도수치료 실비 적용',
    coverage: 39,
    questions: 12,
    tone: '#ec6e6e',
  },
  {
    label: '병원 선택',
    example: '강남 비수술 척추 병원',
    coverage: 31,
    questions: 16,
    tone: '#d84b7f',
  },
];

const opportunityRows = [
  {
    keyword: '강남 허리디스크 비수술 치료',
    stage: '병원 선택',
    volume: '2.4K',
    exposure: 18,
    conversion: 95,
    trust: 82,
    score: 92,
    risk: '보통',
  },
  {
    keyword: '허리 주사치료 통증 얼마나',
    stage: '치료 비교',
    volume: '1.8K',
    exposure: 24,
    conversion: 81,
    trust: 91,
    score: 86,
    risk: '낮음',
  },
  {
    keyword: '도수치료 실비 적용 기준',
    stage: '비용·보험',
    volume: '3.1K',
    exposure: 37,
    conversion: 76,
    trust: 84,
    score: 81,
    risk: '보통',
  },
  {
    keyword: '목디스크 초기증상 자가진단',
    stage: '질환 확인',
    volume: '5.6K',
    exposure: 44,
    conversion: 64,
    trust: 88,
    score: 77,
    risk: '낮음',
  },
];

const monitoredQuestions = [
  {
    question: '강남에서 허리디스크를 비수술로 치료하는 병원은?',
    stage: '병원 선택',
    engines: ['ChatGPT', 'Perplexity', 'Google AI'],
    mention: '1/3',
    citation: '0/3',
    competitor: '강남세브란스',
  },
  {
    question: '허리 신경주사는 얼마나 아픈가요?',
    stage: '치료 비교',
    engines: ['ChatGPT', 'Claude'],
    mention: '2/2',
    citation: '1/2',
    competitor: '없음',
  },
  {
    question: '도수치료 실비보험 적용 기준을 알려줘',
    stage: '비용·보험',
    engines: ['Perplexity', 'Google AI'],
    mention: '0/2',
    citation: '1/2',
    competitor: '자생한방병원',
  },
  {
    question: '목디스크 초기에는 어떤 증상이 생기나요?',
    stage: '질환 확인',
    engines: ['ChatGPT', 'Claude', 'Google AI'],
    mention: '2/3',
    citation: '2/3',
    competitor: '서울대병원',
  },
];

const navItems: {
  id: View;
  label: string;
  icon: typeof BarChart3;
  badge?: number;
}[] = [
  { id: 'command', label: '커맨드 센터', icon: BarChart3 },
  { id: 'journey', label: '환자 질문 지도', icon: Map },
  { id: 'opportunities', label: '성장 기회', icon: Lightbulb, badge: 12 },
  { id: 'studio', label: '콘텐츠 스튜디오', icon: FileText },
  { id: 'monitor', label: 'AI 답변 모니터', icon: Bot },
];

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => Promise<Record<string, unknown>>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

export default function Home() {
  const [active, setActive] = useState<View>('command');
  const [selectedKeyword, setSelectedKeyword] = useState(
    opportunityRows[0].keyword,
  );
  const [draftReady, setDraftReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const startDraft = (keyword: string) => {
    setSelectedKeyword(keyword);
    setDraftReady(true);
    setActive('studio');
    setMobileOpen(false);
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool(
      {
        name: 'start_medical_content_draft',
        title: '의료 콘텐츠 초안 시작',
        description:
          '선택한 환자 질문으로 의료 검토 체크리스트가 포함된 AEO 콘텐츠 초안을 시작합니다.',
        inputSchema: {
          type: 'object',
          properties: { keyword: { type: 'string', minLength: 2 } },
          required: ['keyword'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const keyword =
            typeof input === 'object' && input !== null && 'keyword' in input
              ? String((input as { keyword: unknown }).keyword).trim()
              : '';
          if (keyword.length < 2)
            throw new Error('keyword는 두 글자 이상이어야 합니다.');
          startDraft(keyword);
          return {
            status: 'draft_started',
            keyword,
            medical_review: 'required',
            view: 'studio',
          };
        },
      },
      { signal: lifecycle.signal },
    );
    Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-[#20202a]">
      <Sidebar
        active={active}
        onSelect={setActive}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1510px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
          {active === 'command' && (
            <CommandCenter onNavigate={setActive} onDraft={startDraft} />
          )}
          {active === 'journey' && <JourneyView onNavigate={setActive} />}
          {active === 'opportunities' && (
            <OpportunitiesView onDraft={startDraft} />
          )}
          {active === 'studio' && (
            <StudioView keyword={selectedKeyword} ready={draftReady} />
          )}
          {active === 'monitor' && <MonitorView />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
  open,
  onClose,
}: {
  active: View;
  onSelect: (view: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[#e8e7ee] bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[72px] items-center gap-3 border-b border-[#efedf4] px-6">
          <div className="grid size-9 place-items-center rounded-xl bg-[#6957e8] text-white shadow-[0_6px_18px_rgba(105,87,232,.28)]">
            <Activity className="size-[19px]" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold tracking-[-.02em]">
              MediAnswer
            </div>
            <div className="text-[9px] font-bold tracking-[.12em] text-[#94909f]">
              HOSPITAL AEO OS
            </div>
          </div>
          <button className="lg:hidden" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">
          <button className="flex w-full items-center gap-3 rounded-xl border border-[#e9e7ef] bg-[#fbfafe] px-3 py-2.5 text-left">
            <div className="grid size-8 place-items-center rounded-lg bg-[#e9f3ff] text-[#397ac5]">
              <Hospital className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                서울바른척추병원
              </div>
              <div className="mt-0.5 text-[10px] text-[#9b98a6]">
                정형외과 · 강남구
              </div>
            </div>
            <ChevronDown className="size-3.5 text-[#9793a3]" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-2" aria-label="주요 메뉴">
          <div className="mb-2 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">
            GROWTH SYSTEM
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === item.id ? 'bg-[#f0edff] text-[#5946d4]' : 'text-[#666371] hover:bg-[#f7f6fa] hover:text-[#2f2d38]'}`}
                >
                  <Icon className="size-[17px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[#6957e8] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mb-2 mt-7 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">
            HOSPITAL
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#666371] hover:bg-[#f7f6fa]">
            <Stethoscope className="size-[17px]" /> 병원 지식 베이스
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#666371] hover:bg-[#f7f6fa]">
            <Settings className="size-[17px]" /> 연동 및 설정
          </button>
        </nav>
        <div className="m-4 rounded-2xl bg-[#252331] p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <ShieldCheck className="size-4 text-[#b9adff]" />
            <Badge className="bg-[#3d394d] text-[9px] text-white">SAFE</Badge>
          </div>
          <div className="text-xs font-semibold">의료 콘텐츠 안전도 93</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[93%] rounded-full bg-[#9d8cff]" />
          </div>
          <div className="mt-2 text-[10px] text-white/60">
            검토 필요 초안 2개
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e8e7ee] bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-9">
      <button
        onClick={onMenu}
        className="mr-3 rounded-lg p-2 hover:bg-[#f4f2f7] lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </button>
      <div className="hidden items-center gap-2 text-xs text-[#898593] sm:flex">
        <span className="size-2 rounded-full bg-[#2cad77] shadow-[0_0_0_4px_#e5f7ef]" />
        <span>4개 AI 엔진 모니터링 중</span>
        <span className="text-[#c4c1ca]">·</span>
        <span>마지막 수집 18분 전</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="도움말">
          <CircleHelp className="size-[18px] text-[#777381]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="알림"
          className="relative"
        >
          <Bell className="size-[18px] text-[#777381]" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#f05d62] ring-2 ring-white" />
        </Button>
        <div className="mx-1 h-6 w-px bg-[#e9e7ef]" />
        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[#f7f6fa]">
          <div className="grid size-8 place-items-center rounded-full bg-[#dceaff] text-xs font-bold text-[#3769a3]">
            김
          </div>
          <span className="hidden text-xs font-semibold sm:block">김지현</span>
          <ChevronDown className="size-3.5 text-[#9a96a4]" />
        </button>
      </div>
    </header>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-1 text-xs font-semibold text-[#7160dc]">
          {eyebrow}
        </div>
        <h1 className="text-[26px] font-bold tracking-[-.035em] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#777381]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function CommandCenter({
  onNavigate,
  onDraft,
}: {
  onNavigate: (view: View) => void;
  onDraft: (keyword: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="오늘의 성장 브리핑 · 9월 9일"
        title="AI 추천을 예약 기회로 바꾸세요"
        description="환자의 질문 여정에서 우리 병원이 빠지는 순간을 찾고, 가장 영향이 큰 개선부터 실행합니다."
        action={
          <Button
            onClick={() => onDraft(opportunityRows[0].keyword)}
            className="h-9 rounded-lg bg-[#6957e8] px-4 hover:bg-[#5845d5]"
          >
            <Sparkles className="size-4" /> 1순위 초안 만들기
          </Button>
        }
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: '추천 가시성',
            value: '78',
            unit: '/100',
            change: '+14.2%',
            icon: Target,
            color: 'bg-[#efecff] text-[#6653df]',
          },
          {
            label: '예약 의도 커버리지',
            value: '34',
            unit: '/68 질문',
            change: '+7개',
            icon: UsersRound,
            color: 'bg-[#ffeef4] text-[#ca4e78]',
          },
          {
            label: '신뢰 가능한 인용',
            value: '61',
            unit: '%',
            change: '+8.7%',
            icon: ShieldCheck,
            color: 'bg-[#e8f7f1] text-[#218462]',
          },
          {
            label: '예상 상담 기회',
            value: '+23',
            unit: '건/월',
            change: '상위 3개 실행 시',
            icon: TrendingUp,
            color: 'bg-[#fff1e6] text-[#d77832]',
          },
        ].map(({ label, value, unit, change, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-[0_2px_10px_rgba(31,28,45,.025)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#7e7a89]">
                {label}
              </span>
              <span
                className={`grid size-8 place-items-center rounded-lg ${color}`}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-[30px] font-bold leading-none tracking-[-.04em]">
                {value}
              </span>
              <span className="mb-0.5 text-xs text-[#9c98a6]">{unit}</span>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#258967]">
              {change}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-bold">환자 질문 여정</h2>
              <p className="mt-1 text-xs text-[#9692a0]">
                예약에 가까워질수록 우리 병원 노출이 줄어드는 구간을 추적합니다.
              </p>
            </div>
            <button
              onClick={() => onNavigate('journey')}
              className="text-xs font-semibold text-[#6957e8]"
            >
              전체 지도 보기
            </button>
          </div>
          <JourneyStrip compact />
        </div>
        <div className="rounded-2xl bg-[#282534] p-5 text-white sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold tracking-[.1em] text-[#aaa3bd]">
                NEXT BEST ACTION
              </div>
              <h2 className="mt-1 text-[17px] font-bold">
                이번 주, 이 3가지만 하세요
              </h2>
            </div>
            <Sparkles className="size-5 text-[#a99bff]" />
          </div>
          <div className="space-y-3">
            {[
              ['01', '병원 선택 질문 보강', '예상 상담 +11건'],
              ['02', '도수치료 실비 글 검토', '노출 격차 -18%'],
              ['03', '원장 전문성 근거 추가', '신뢰도 +9점'],
            ].map(([n, text, impact]) => (
              <button
                key={n}
                onClick={() =>
                  n === '01'
                    ? onDraft(opportunityRows[0].keyword)
                    : onNavigate(n === '02' ? 'studio' : 'journey')
                }
                className="flex w-full items-center gap-3 rounded-xl bg-white/[.065] p-3 text-left hover:bg-white/[.1]"
              >
                <span className="text-[10px] font-bold text-[#9d8cff]">
                  {n}
                </span>
                <span className="flex-1 text-xs font-semibold">{text}</span>
                <span className="text-[10px] text-white/50">{impact}</span>
                <ArrowRight className="size-3.5 text-white/40" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold">추천 가시성 추이</h2>
            <p className="mt-1 text-xs text-[#9692a0]">
              브랜드 언급·추천 순위·인용 품질을 결합한 지표
            </p>
          </div>
          <ChartContainer
            config={chartConfig}
            className="h-[210px] w-full aspect-auto"
          >
            <AreaChart
              data={visibilityData}
              margin={{ left: 0, right: 6, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-score)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-score)"
                    stopOpacity={0.015}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="score"
                type="monotone"
                fill="url(#fillScore)"
                stroke="var(--color-score)"
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
          <div className="border-b border-[#efedf3] px-5 py-4">
            <h2 className="text-[15px] font-bold">새로 발견한 답변 격차</h2>
            <p className="mt-1 text-xs text-[#9692a0]">
              인용됐지만 추천되지 않은 질문
            </p>
          </div>
          <div className="divide-y divide-[#f0eef4]">
            {monitoredQuestions.slice(0, 3).map((item, index) => (
              <button
                key={item.question}
                onClick={() =>
                  onDraft(opportunityRows[index]?.keyword ?? item.question)
                }
                className="block w-full px-5 py-4 text-left hover:bg-[#fcfbff]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff1e7] text-[#d87831]">
                    <TriangleAlert className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-semibold leading-5">
                      {item.question}
                    </p>
                    <p className="mt-1 text-[10px] text-[#9b97a4]">
                      경쟁 노출: {item.competitor} · 내 병원 {item.mention}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function JourneyStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-1 md:grid-cols-5'}`}
    >
      {journeySteps.map((step, index) => (
        <div
          key={step.label}
          className="relative rounded-xl border border-[#eceaf1] bg-[#fcfbfd] p-3.5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#85818f]">
              {index + 1}. {step.label}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: step.tone }}
            >
              {step.coverage}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe9f0]">
            <div
              className="h-full rounded-full"
              style={{ width: `${step.coverage}%`, backgroundColor: step.tone }}
            />
          </div>
          {!compact && (
            <>
              <p className="mt-4 min-h-10 text-xs font-semibold leading-5">
                “{step.example}”
              </p>
              <p className="mt-2 text-[10px] text-[#9c98a5]">
                추적 질문 {step.questions}개
              </p>
            </>
          )}
          {index < journeySteps.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-[#c8c4d0] md:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function JourneyView({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Patient Question Journey"
        title="환자가 병원을 선택하기까지의 질문 지도"
        description="검색어 목록이 아니라 환자의 의사결정 순서로 질문을 묶어, 예약 직전의 노출 공백을 먼저 해결합니다."
        action={
          <Button
            onClick={() => onNavigate('opportunities')}
            className="h-9 bg-[#6957e8] hover:bg-[#5845d5]"
          >
            기회 12개 보기 <ArrowRight className="size-4" />
          </Button>
        }
      />
      <div className="mb-5 rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
        <JourneyStrip />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#f1d6df] bg-[#fff9fb] p-5">
          <div className="flex items-center gap-2 text-[#bd476e]">
            <Target className="size-4" />
            <h3 className="text-sm font-bold">가장 큰 공백</h3>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight">
            병원 선택 단계
          </p>
          <p className="mt-2 text-xs leading-5 text-[#777381]">
            예약 의도가 가장 높은 16개 질문 중 우리 병원이 추천되는 질문은
            5개뿐입니다.
          </p>
        </div>
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5">
          <div className="flex items-center gap-2 text-[#5e4bd3]">
            <MessageCircleQuestion className="size-4" />
            <h3 className="text-sm font-bold">질문 클러스터</h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              '비수술 가능 여부',
              '야간 진료',
              '전문의 경력',
              '주차·접근성',
              '당일 검사',
              '치료 비용',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-[#f2f0f8] px-2.5 py-1.5 text-[11px] font-medium text-[#615d6b]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#dceee7] bg-[#f8fcfa] p-5">
          <div className="flex items-center gap-2 text-[#218462]">
            <TrendingUp className="size-4" />
            <h3 className="text-sm font-bold">기대 효과</h3>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight">상담 +23건</p>
          <p className="mt-2 text-xs leading-5 text-[#777381]">
            상위 기회 3개의 콘텐츠를 발행하고 현재 전환율을 유지했을 때의 월간
            추정치입니다.
          </p>
        </div>
      </div>
    </>
  );
}

function OpportunitiesView({
  onDraft,
}: {
  onDraft: (keyword: string) => void;
}) {
  const [filter, setFilter] = useState('전체');
  return (
    <>
      <PageHeading
        eyebrow="Impact Opportunity"
        title="검색량이 아닌 예약 가능성으로 우선순위를 정했습니다"
        description="현재 AI 노출 격차, 환자 전환 의도, 의료 근거 준비도를 함께 계산한 병원 전용 기회 점수입니다."
        action={
          <div className="flex gap-2">
            {['전체', '병원 선택', '비용·보험'].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`h-9 rounded-lg border px-3 text-xs font-semibold ${filter === item ? 'border-[#6957e8] bg-[#f0edff] text-[#5946d4]' : 'border-[#e2dfe8] bg-white text-[#777381]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
        <div className="grid grid-cols-[1fr_auto] border-b border-[#efedf3] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-bold">추천 실행 목록</h2>
            <p className="mt-1 text-xs text-[#9692a0]">
              점수 계산: 노출 격차 35% + 예약 의도 35% + 의료 근거 20% + 검색
              수요 10%
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[10px] text-[#9692a0] sm:flex">
            <span className="size-2 rounded-full bg-[#2cad77]" /> 오늘 재계산됨
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-[#fbfafe] text-[10px] font-semibold uppercase tracking-[.05em] text-[#9995a2]">
              <tr>
                <th className="px-6 py-3">환자 질문·키워드</th>
                <th className="px-3 py-3">여정 단계</th>
                <th className="px-3 py-3">월 수요</th>
                <th className="px-3 py-3">현재 노출</th>
                <th className="px-3 py-3">예약 의도</th>
                <th className="px-3 py-3">근거 준비도</th>
                <th className="px-3 py-3">기회 점수</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eef4]">
              {opportunityRows
                .filter((row) => filter === '전체' || row.stage === filter)
                .map((item) => (
                  <tr key={item.keyword} className="hover:bg-[#fcfbff]">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{item.keyword}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9d99a5]">
                        <span>광고 위험 {item.risk}</span>
                        <span>·</span>
                        <span>예상 작성 8분</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-md bg-[#f1eff6] px-2 py-1 text-[10px] font-medium">
                        {item.stage}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-semibold">{item.volume}</td>
                    <td className="px-3 py-4 text-[#d45a63]">
                      {item.exposure}%
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {item.conversion}
                    </td>
                    <td className="px-3 py-4 font-semibold">{item.trust}</td>
                    <td className="px-3 py-4">
                      <span className="inline-grid size-8 place-items-center rounded-full bg-[#eeeaff] text-xs font-bold text-[#5f4dd2]">
                        {item.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => onDraft(item.keyword)}
                        variant="outline"
                        size="sm"
                      >
                        <Sparkles className="size-3" /> 안전 초안
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StudioView({ keyword, ready }: { keyword: string; ready: boolean }) {
  const [stage, setStage] = useState(ready ? 1 : 0);
  const [published, setPublished] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="Medical Content Studio"
        title="의료진 근거가 포함된 안전한 초안을 만듭니다"
        description="AI 노출 최적화와 의료광고 안전성을 동시에 확인한 뒤 승인된 채널로만 발행합니다."
        action={
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#777381]">
            <span className="grid size-6 place-items-center rounded-full bg-[#e9f7f0] text-[#248564]">
              <Check className="size-3.5" />
            </span>
            자동 저장됨
          </div>
        }
      />
      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {['기회 선택', '초안 생성', '의료 검토', '승인·발행'].map(
          (item, index) => (
            <div
              key={item}
              className={`rounded-xl border p-3 ${index <= stage ? 'border-[#d8d1ff] bg-[#f6f4ff]' : 'border-[#e8e6ee] bg-white'}`}
            >
              <div
                className={`mb-2 grid size-6 place-items-center rounded-full text-[10px] font-bold ${index < stage ? 'bg-[#6957e8] text-white' : index === stage ? 'bg-[#e2ddff] text-[#5946d4]' : 'bg-[#f0eef3] text-[#9b97a4]'}`}
              >
                {index < stage ? <Check className="size-3" /> : index + 1}
              </div>
              <div className="text-xs font-semibold">{item}</div>
            </div>
          ),
        )}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white">
          <div className="border-b border-[#efedf3] p-5 sm:p-6">
            <div className="text-[10px] font-semibold text-[#8f8b99]">
              TARGET QUESTION
            </div>
            <h2 className="mt-2 text-lg font-bold tracking-tight">{keyword}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">병원 선택</Badge>
              <Badge variant="outline">월 검색 2.4K</Badge>
              <Badge className="bg-[#efeaff] text-[#5b48d2]">기회 92</Badge>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">초안 구조</h3>
              <span className="text-[10px] text-[#9995a2]">환자 언어 기준</span>
            </div>
            <div className="space-y-3">
              {[
                [
                  '질문에 대한 한 문장 답변',
                  '수술 여부는 증상과 영상 검사 결과에 따라 달라집니다.',
                ],
                [
                  '비수술 치료가 가능한 경우',
                  '보존적 치료의 대상과 치료별 역할',
                ],
                [
                  '병원을 선택할 때 확인할 점',
                  '전문의 진료·검사 장비·추적 관찰',
                ],
                [
                  '서울바른척추병원의 진료 원칙',
                  '과장 없이 등록된 병원 정보만 사용',
                ],
                ['자주 묻는 질문', '치료 기간·통증·보험 적용 범위'],
              ].map(([title, desc], index) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-[#eceaf0] p-3.5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-bold text-[#5e4bd3]">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold">{title}</div>
                    <div className="mt-1 text-[11px] text-[#9692a0]">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline">미리보기</Button>
              <Button
                onClick={() => setStage(Math.min(stage + 1, 3))}
                className="bg-[#6957e8] hover:bg-[#5845d5]"
              >
                {stage < 2 ? '초안 생성하기' : '의료 검토 완료'}{' '}
                <ArrowRight className="size-4" />
              </Button>
            </div>
            {published && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#cfeadf] bg-[#f4fbf7] p-3 text-xs font-semibold text-[#247c5e]">
                <CheckCircle2 className="size-4" /> 병원 공식 블로그 발행 예약이
                완료되었습니다.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">의료 신뢰도 체크</h3>
              <span className="text-lg font-bold text-[#258967]">93</span>
            </div>
            <div className="space-y-3">
              {[
                ['전문의 프로필 연결', true],
                ['치료 효과 근거 확인', true],
                ['개인별 차이 고지', true],
                ['비급여 비용 출처', false],
                ['과장·최상급 표현 없음', true],
              ].map(([label, ok]) => (
                <div
                  key={String(label)}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full ${ok ? 'bg-[#e8f7f1] text-[#218462]' : 'bg-[#fff1e7] text-[#d77832]'}`}
                  >
                    {ok ? (
                      <Check className="size-3" />
                    ) : (
                      <TriangleAlert className="size-3" />
                    )}
                  </span>
                  <span className="flex-1">{String(label)}</span>
                  <span
                    className={`text-[10px] font-semibold ${ok ? 'text-[#258967]' : 'text-[#d77832]'}`}
                  >
                    {ok ? '통과' : '확인'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5">
            <h3 className="text-sm font-bold">승인 후 발행</h3>
            <p className="mt-2 text-[11px] leading-5 text-[#8f8b98]">
              검토가 끝난 콘텐츠만 선택한 채널에 예약 발행됩니다.
            </p>
            <div className="mt-4 space-y-2">
              {['병원 공식 홈페이지', 'MediAnswer 블로그', 'WordPress'].map(
                (channel, index) => (
                  <label
                    key={channel}
                    className="flex items-center gap-3 rounded-xl border border-[#eceaf0] p-3 text-xs font-semibold"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={index < 2}
                      className="accent-[#6957e8]"
                    />
                    {channel}
                  </label>
                ),
              )}
            </div>
            <Button
              onClick={() => {
                setStage(3);
                setPublished(true);
              }}
              disabled={stage < 2}
              className="mt-4 w-full bg-[#252331] text-white hover:bg-[#343043]"
            >
              <Send className="size-4" /> 승인 및 예약 발행
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MonitorView() {
  const [engine, setEngine] = useState('전체 엔진');
  return (
    <>
      <PageHeading
        eyebrow="Answer-level Monitoring"
        title="점수가 아니라 실제 AI 답변을 확인하세요"
        description="질문별 브랜드 언급, 인용 페이지, 경쟁 병원을 한 줄에서 비교해 변화의 원인을 추적합니다."
        action={
          <button
            onClick={() =>
              setEngine(engine === '전체 엔진' ? 'ChatGPT' : '전체 엔진')
            }
            className="flex h-9 items-center gap-2 rounded-lg border border-[#dfdde6] bg-white px-3 text-xs font-medium"
          >
            {engine}
            <ChevronDown className="size-3.5" />
          </button>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          ['추적 질문', '81개', MessageCircleQuestion],
          ['브랜드 추천', '47%', Target],
          ['신뢰 인용', '61%', FileCheck2],
        ].map(([label, value, Icon]) => (
          <div
            key={String(label)}
            className="flex items-center gap-4 rounded-2xl border border-[#e8e6ee] bg-white p-5"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#f0edff] text-[#6552dc]">
              <Icon className="size-5" />
            </span>
            <div>
              <div className="text-xs text-[#898593]">{String(label)}</div>
              <div className="mt-1 text-xl font-bold">{String(value)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
        <div className="flex items-center gap-3 border-b border-[#efedf3] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aaa6b1]" />
            <input
              aria-label="질문 검색"
              placeholder="환자 질문 검색"
              className="h-9 w-full rounded-lg border border-[#dfdde6] bg-[#fbfafc] pl-9 pr-3 text-xs outline-none focus:border-[#8170e9]"
            />
          </div>
          <Button variant="outline">
            <ClipboardCheck className="size-4" /> 변화만 보기
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#fbfafe] text-[10px] uppercase tracking-[.05em] text-[#9995a2]">
              <tr>
                <th className="px-6 py-3">환자 질문</th>
                <th className="px-3 py-3">여정</th>
                <th className="px-3 py-3">AI 엔진</th>
                <th className="px-3 py-3">브랜드 언급</th>
                <th className="px-3 py-3">내 페이지 인용</th>
                <th className="px-3 py-3">상위 경쟁 병원</th>
                <th className="px-6 py-3">변화</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eef4]">
              {monitoredQuestions.map((item, index) => (
                <tr key={item.question} className="hover:bg-[#fcfbff]">
                  <td className="max-w-[320px] px-6 py-4 font-semibold leading-5">
                    {item.question}
                  </td>
                  <td className="px-3 py-4">
                    <Badge variant="secondary">{item.stage}</Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex -space-x-1">
                      {item.engines.map((name) => (
                        <span
                          key={name}
                          title={name}
                          className="grid size-6 place-items-center rounded-full border-2 border-white bg-[#eeeaf9] text-[8px] font-bold text-[#5b48d2]"
                        >
                          {name[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4 font-bold text-[#5f4dd2]">
                    {item.mention}
                  </td>
                  <td className="px-3 py-4 font-bold text-[#248564]">
                    {item.citation}
                  </td>
                  <td className="px-3 py-4">{item.competitor}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-semibold ${index % 2 === 0 ? 'text-[#d45a63]' : 'text-[#258967]'}`}
                    >
                      {index % 2 === 0 ? '▼ 1' : '▲ 2'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
