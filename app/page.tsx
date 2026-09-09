'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Hospital,
  KeyRound,
  Link2,
  LockKeyhole,
  Map,
  Menu,
  MessageCircleQuestion,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TriangleAlert,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import clinicData from '@/data/withyou-clinic.json';

type View =
  | 'command'
  | 'journey'
  | 'opportunities'
  | 'studio'
  | 'monitor'
  | 'knowledge'
  | 'settings';
type FactStatus =
  | 'source_confirmed'
  | 'medical_review_required'
  | 'needs_confirmation'
  | 'blocked_claim';
type Fact = (typeof clinicData.facts)[number] & { status: FactStatus };

const facts = clinicData.facts as Fact[];
const opportunities = clinicData.opportunities;

const statusMeta: Record<
  FactStatus,
  { label: string; tone: string; dot: string; description: string }
> = {
  source_confirmed: {
    label: '공식 출처 확인',
    tone: 'border-[#cfe9df] bg-[#eff9f4] text-[#247c5e]',
    dot: 'bg-[#2cad77]',
    description: '병원 공식 홈페이지에서 확인된 공개 정보',
  },
  medical_review_required: {
    label: '의료진 검수',
    tone: 'border-[#dfd9ff] bg-[#f4f1ff] text-[#5d49d2]',
    dot: 'bg-[#7562e8]',
    description: '현재 운영 여부와 환자 대상 표현을 확인할 정보',
  },
  needs_confirmation: {
    label: '병원 확인 필요',
    tone: 'border-[#f2dfc5] bg-[#fff8ed] text-[#af671e]',
    dot: 'bg-[#e59b42]',
    description: '페이지 표기가 다르거나 최신 확인이 필요한 정보',
  },
  blocked_claim: {
    label: '콘텐츠 사용 차단',
    tone: 'border-[#f1d2d5] bg-[#fff3f4] text-[#bc4c57]',
    dot: 'bg-[#dc5962]',
    description: '근거와 의료·광고 검토 전 사용할 수 없는 주장',
  },
};

const counts = facts.reduce(
  (result, fact) => {
    result[fact.status] += 1;
    return result;
  },
  {
    source_confirmed: 0,
    medical_review_required: 0,
    needs_confirmation: 0,
    blocked_claim: 0,
  } as Record<FactStatus, number>,
);

const navItems: {
  id: View;
  label: string;
  icon: typeof Activity;
  badge?: number;
}[] = [
  { id: 'command', label: '온보딩 센터', icon: Activity },
  { id: 'journey', label: '환자 질문 지도', icon: Map },
  {
    id: 'opportunities',
    label: '성장 기회',
    icon: Sparkles,
    badge: opportunities.length,
  },
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
  const [question, setQuestion] = useState(opportunities[0].question);
  const [briefReady, setBriefReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openBrief = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    setBriefReady(true);
    setActive('studio');
    setMobileOpen(false);
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool(
      {
        name: 'prepare_withyou_medical_content_brief',
        title: '위드유 의료 콘텐츠 브리프 준비',
        description:
          '환자 질문을 위드유 공식 지식베이스와 의료 검수 규칙에 연결한 콘텐츠 브리프로 엽니다.',
        inputSchema: {
          type: 'object',
          properties: { question: { type: 'string', minLength: 2 } },
          required: ['question'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const nextQuestion =
            typeof input === 'object' && input !== null && 'question' in input
              ? String((input as { question: unknown }).question).trim()
              : '';
          if (nextQuestion.length < 2)
            throw new Error('질문은 두 글자 이상이어야 합니다.');
          openBrief(nextQuestion);
          return {
            status: 'brief_ready',
            hospital: clinicData.hospital.brandName,
            question: nextQuestion,
            medical_review: 'required',
            blocked_claims: counts.blocked_claim,
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
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onSelect={(view) => {
          setActive(view);
          setMobileOpen(false);
        }}
      />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1510px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
          {active === 'command' && (
            <CommandCenter onNavigate={setActive} onBrief={openBrief} />
          )}
          {active === 'journey' && (
            <JourneyView onNavigate={setActive} onBrief={openBrief} />
          )}
          {active === 'opportunities' && (
            <OpportunitiesView onBrief={openBrief} />
          )}
          {active === 'studio' && (
            <StudioView question={question} ready={briefReady} />
          )}
          {active === 'monitor' && <MonitorView onNavigate={setActive} />}
          {active === 'knowledge' && <KnowledgeView />}
          {active === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  open,
  onClose,
  onSelect,
}: {
  active: View;
  open: boolean;
  onClose: () => void;
  onSelect: (view: View) => void;
}) {
  return (
    <>
      {open ? (
        <button
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}
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
          <button
            className="lg:hidden"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => onSelect('knowledge')}
            className="flex w-full items-center gap-3 rounded-xl border border-[#dcd7fa] bg-[#f8f7ff] px-3 py-2.5 text-left transition hover:border-[#c9c0fb]"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[#e9f3ff] text-[#397ac5]">
              <Hospital className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {clinicData.hospital.brandName}
              </span>
              <span className="mt-0.5 block text-[10px] text-[#8f8b98]">
                {clinicData.hospital.category} · 강남구
              </span>
            </span>
            <ChevronDown className="size-3.5 text-[#9793a3]" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-2"
          aria-label="주요 메뉴"
        >
          <div className="mb-2 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">
            AEO WORKFLOW
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === item.id ? 'bg-[#f0edff] text-[#5946d4]' : 'text-[#666371] hover:bg-[#f7f6fa] hover:text-[#2f2d38]'}`}
                >
                  <Icon className="size-[17px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-[#6957e8] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mb-2 mt-7 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">
            HOSPITAL
          </div>
          <SideButton
            active={active === 'knowledge'}
            icon={Database}
            label="병원 지식 베이스"
            suffix={String(facts.length)}
            onClick={() => onSelect('knowledge')}
          />
          <SideButton
            active={active === 'settings'}
            icon={Settings}
            label="연동 및 설정"
            onClick={() => onSelect('settings')}
          />
        </nav>

        <div className="m-4 rounded-2xl bg-[#252331] p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <ShieldCheck className="size-4 text-[#b9adff]" />
            <Badge className="bg-[#3d394d] text-[9px] text-white">
              SAFETY FIRST
            </Badge>
          </div>
          <div className="text-xs font-semibold">위험 주장 자동 차단</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{counts.blocked_claim}</span>
            <span className="text-[10px] text-white/55">개 표현</span>
          </div>
          <div className="mt-2 text-[10px] leading-4 text-white/60">
            의료진 승인 전 콘텐츠에 사용하지 않습니다.
          </div>
        </div>
      </aside>
    </>
  );
}

function SideButton({
  active,
  icon: Icon,
  label,
  suffix,
  onClick,
}: {
  active: boolean;
  icon: typeof Activity;
  label: string;
  suffix?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-[#f0edff] text-[#5946d4]' : 'text-[#666371] hover:bg-[#f7f6fa]'}`}
    >
      <Icon className="size-[17px]" />
      <span className="flex-1 text-left">{label}</span>
      {suffix ? <span className="text-[10px] font-bold">{suffix}</span> : null}
    </button>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e8e7ee] bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-9">
      <button
        onClick={onMenu}
        className="mr-3 rounded-lg p-2 lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </button>
      <div className="hidden items-center gap-2 text-xs text-[#777381] sm:flex">
        <span className="size-2 rounded-full bg-[#2cad77] shadow-[0_0_0_4px_#e5f7ef]" />
        <span>공식 홈페이지 연결됨</span>
        <span className="text-[#c4c1ca]">·</span>
        <span>외부 데이터 연결 전</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="도움말">
          <CircleHelp className="size-[18px] text-[#777381]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="검수 알림"
          className="relative"
        >
          <Bell className="size-[18px] text-[#777381]" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#f05d62] ring-2 ring-white" />
        </Button>
        <div className="mx-1 h-6 w-px bg-[#e9e7ef]" />
        <div className="flex items-center gap-2 rounded-lg p-1.5">
          <div className="grid size-8 place-items-center rounded-full bg-[#e9f3ff] text-[10px] font-bold text-[#3769a3]">
            WU
          </div>
          <span className="hidden text-xs font-semibold sm:block">위드유</span>
        </div>
      </div>
    </header>
  );
}

function Heading({
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
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777381]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-[0_2px_10px_rgba(31,28,45,.025)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#7e7a89]">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-[30px] font-bold leading-none tracking-[-.04em]">
          {value}
        </span>
        <span className="mb-0.5 text-xs text-[#9c98a6]">{unit}</span>
      </div>
      <div className="mt-3 text-[11px] text-[#777381]">{note}</div>
    </div>
  );
}

function CommandCenter({
  onNavigate,
  onBrief,
}: {
  onNavigate: (view: View) => void;
  onBrief: (question: string) => void;
}) {
  const reviewTotal =
    counts.medical_review_required + counts.needs_confirmation;
  const steps = [
    ['공식 홈페이지 연결', '완료', true, '11개 핵심 페이지 등록'],
    [
      '지식 구조화·위험 표현 분리',
      '완료',
      true,
      `${facts.length}개 레코드 생성`,
    ],
    [
      '병원 담당자·의료진 검수',
      '진행 필요',
      false,
      `${reviewTotal}개 확인 대기`,
    ],
    ['Search Console·AI 연결', '권한 필요', false, '실제 검색 및 답변 기준선'],
    ['콘텐츠 승인·CMS 발행', '대기', false, '의료진 승인 후 발행'],
  ] as const;

  return (
    <>
      <Heading
        eyebrow={`위드유 온보딩 · ${clinicData.hospital.collectedAt}`}
        title="공식 홈페이지를 안전한 AEO 지식베이스로 전환했습니다"
        description="AI 노출 점수를 꾸며내지 않고 공개 정보를 출처별로 정리했습니다. 병원 확인과 외부 데이터 연결이 끝나면 실제 기준선 측정을 시작합니다."
        action={
          <Button
            onClick={() => onNavigate('knowledge')}
            className="bg-[#6957e8] hover:bg-[#5845d5]"
          >
            <Database className="size-4" /> 지식베이스 검수
          </Button>
        }
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="수집한 지식"
          value={String(facts.length)}
          unit="개"
          note="공식 페이지 11개 기준"
          icon={Database}
          tone="bg-[#efecff] text-[#6653df]"
        />
        <Metric
          label="공식 출처 확인"
          value={String(counts.source_confirmed)}
          unit="개"
          note="기본·운영·진료 정보"
          icon={CheckCircle2}
          tone="bg-[#e8f7f1] text-[#218462]"
        />
        <Metric
          label="검수 대기"
          value={String(reviewTotal)}
          unit="개"
          note="의료진 또는 병원 확인"
          icon={UserRoundCheck}
          tone="bg-[#fff1e6] text-[#d77832]"
        />
        <Metric
          label="사용 차단 주장"
          value={String(counts.blocked_claim)}
          unit="개"
          note="근거 확인 전 생성 금지"
          icon={LockKeyhole}
          tone="bg-[#ffeef1] text-[#c75161]"
        />
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold">실서비스 시작 단계</h2>
              <p className="mt-1 text-xs text-[#9692a0]">
                담당자 확인을 기다리는 단계입니다.
              </p>
            </div>
            <span className="rounded-full bg-[#f0edff] px-2.5 py-1 text-[10px] font-bold text-[#5d49d2]">
              2 / 5 완료
            </span>
          </div>
          <div className="space-y-2">
            {steps.map(([title, status, done, detail], index) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-[#eceaf1] px-3.5 py-3"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${done ? 'bg-[#e8f7f1] text-[#218462]' : 'bg-[#f1eff5] text-[#8b8794]'}`}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{title}</div>
                  <div className="mt-0.5 text-[10px] text-[#9894a1]">
                    {detail}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold ${done ? 'text-[#258967]' : 'text-[#9a96a3]'}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <Button
            onClick={() => onNavigate('settings')}
            variant="outline"
            className="mt-4 w-full"
          >
            다음 연결 확인하기 <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#efdadd] bg-white">
          <div className="border-b border-[#f2e5e7] bg-[#fff8f8] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-[#bc4c57]">
              <ShieldAlert className="size-4" />
              <h2 className="text-[15px] font-bold">먼저 확인할 데이터</h2>
            </div>
            <p className="mt-1 text-xs text-[#8f7d80]">
              AI 콘텐츠에 그대로 사용하면 안 됩니다.
            </p>
          </div>
          <div className="divide-y divide-[#f2eaeb]">
            {[
              [
                '진료 경력 연수 불일치',
                '15년·18년·20년 표기가 혼재',
                '병원 확인',
              ],
              [
                '토요일 진료시간 재확인',
                '현재 페이지와 이전 검색 캐시가 다름',
                '전화 확인',
              ],
              [
                '92% 호전·면역세포 주장',
                '원보고서 확인 전 콘텐츠 사용 차단',
                '근거 필요',
              ],
              [
                '완치·국내 유일·재발 방지',
                '효과 보장·최상급으로 오인 가능',
                '사용 금지',
              ],
            ].map(([title, detail, status]) => (
              <button
                key={title}
                onClick={() => onNavigate('knowledge')}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-[#fffafa] sm:px-6"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff0f1] text-[#c75161]">
                  <TriangleAlert className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{title}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-[#9692a0]">
                    {detail}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-bold text-[#bc4c57]">
                  {status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold">환자 질문 여정 초안</h2>
              <p className="mt-1 text-xs text-[#9692a0]">
                검색량이 아닌 홈페이지 근거 준비도입니다.
              </p>
            </div>
            <button
              onClick={() => onNavigate('journey')}
              className="text-xs font-semibold text-[#6957e8]"
            >
              전체 보기
            </button>
          </div>
          <JourneyStrip compact />
        </div>
        <div className="rounded-2xl bg-[#282534] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold tracking-[.1em] text-[#aaa3bd]">
                FIRST CONTENT BRIEF
              </div>
              <h2 className="mt-1 text-[17px] font-bold">
                검사 질문부터 시작하세요
              </h2>
            </div>
            <Sparkles className="size-5 text-[#a99bff]" />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/65">
            공개 근거가 가장 많이 준비되어 있어 과장 없이 유용한 답변으로
            전환하기 좋습니다.
          </p>
          <button
            onClick={() => onBrief(opportunities[0].question)}
            className="mt-4 flex w-full items-center gap-3 rounded-xl bg-white/[.075] p-3 text-left hover:bg-white/[.12]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#7562e8] text-xs font-bold">
              01
            </span>
            <span className="flex-1 text-xs font-semibold leading-5">
              {opportunities[0].question}
            </span>
            <ArrowRight className="size-4 text-white/45" />
          </button>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/50">
            <ShieldCheck className="size-3.5" /> 의료진 검수 전에는 발행하지
            않습니다.
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
      {clinicData.journey.map((step, index) => (
        <div
          key={step.stage}
          className="relative rounded-xl border border-[#eceaf1] bg-[#fcfbfd] p-3.5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#85818f]">
              {index + 1}. {step.stage}
            </span>
            <span className="text-[10px] font-bold text-[#6653df]">
              {step.readiness}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe9f0]">
            <div
              className="h-full rounded-full bg-[#7562e8]"
              style={{ width: `${step.readiness}%` }}
            />
          </div>
          {!compact ? (
            <>
              <p className="mt-4 min-h-14 text-xs font-semibold leading-5">
                “{step.question}”
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#9c98a5]">
                <span>질문 {step.tracked}개</span>
                <span>{step.status}</span>
              </div>
            </>
          ) : null}
          {index < clinicData.journey.length - 1 ? (
            <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-[#c8c4d0] md:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function JourneyView({
  onNavigate,
  onBrief,
}: {
  onNavigate: (view: View) => void;
  onBrief: (question: string) => void;
}) {
  return (
    <>
      <Heading
        eyebrow="Patient Question Journey"
        title="위드유를 찾기 전 환자가 묻는 질문을 정리했습니다"
        description="현재 수치는 AI 노출 점수가 아니라 공식 홈페이지가 답변 근거를 얼마나 준비하고 있는지 보여주는 초기 콘텐츠 준비도입니다."
        action={
          <Button
            onClick={() => onNavigate('opportunities')}
            className="bg-[#6957e8] hover:bg-[#5845d5]"
          >
            기회 {opportunities.length}개 보기 <ArrowRight className="size-4" />
          </Button>
        }
      />
      <div className="mb-5 rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
        <JourneyStrip />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Insight
          icon={Target}
          title="가장 안전한 시작점"
          value="검사 이해"
          description="검사 종류와 공식 근거가 준비되어 첫 브리프에 적합합니다."
          tone="border-[#ded8fb] bg-[#faf9ff] text-[#5d49d2]"
        />
        <Insight
          icon={MessageCircleQuestion}
          title="먼저 묶을 질문"
          value="예약 전 확인"
          description="예약제·야간진료·의료진·검사를 병원 선택 질문으로 연결합니다."
          tone="border-[#d9e8f7] bg-[#f8fbff] text-[#397ac5]"
        />
        <Insight
          icon={ShieldAlert}
          title="주의할 구간"
          value="치료 비교"
          description="효과 단정과 재발 방지 표현을 걷어내고 다시 구성해야 합니다."
          tone="border-[#f1d6df] bg-[#fff9fb] text-[#bd476e]"
        />
      </div>
      <div className="mt-5 rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
        <h2 className="text-[15px] font-bold">첫 질문 세트</h2>
        <p className="mt-1 text-xs text-[#9692a0]">
          질문을 선택하면 공식 근거와 금지 표현이 연결된 브리프를 엽니다.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {opportunities.slice(0, 4).map((item) => (
            <button
              key={item.question}
              onClick={() => onBrief(item.question)}
              className="flex items-start gap-3 rounded-xl border border-[#eceaf1] p-4 text-left hover:border-[#d6cff7] hover:bg-[#fcfbff]"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-bold text-[#5d49d2]">
                {String(item.priority).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold leading-5">
                  {item.question}
                </span>
                <span className="mt-1 block text-[10px] text-[#9692a0]">
                  {item.stage} · 근거 {item.evidence} · 위험 {item.risk}
                </span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-[#aaa6b1]" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Insight({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: typeof Activity;
  title: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-[#272431]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#777381]">{description}</p>
    </div>
  );
}

function OpportunitiesView({
  onBrief,
}: {
  onBrief: (question: string) => void;
}) {
  const [filter, setFilter] = useState('전체');
  const rows = opportunities.filter(
    (row) => filter === '전체' || row.stage === filter,
  );
  return (
    <>
      <Heading
        eyebrow="Evidence-led Opportunity"
        title="검색량을 꾸며내지 않고, 근거가 준비된 질문부터 골랐습니다"
        description="외부 데이터가 연결되기 전에는 수요를 추정하지 않습니다. 현재 순서는 병원 고유성·환자 유용성·근거 준비도·표현 위험을 기준으로 한 초기 가설입니다."
        action={
          <div className="flex flex-wrap gap-2">
            {['전체', '검사 이해', '병원 선택', '치료 비교'].map((item) => (
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
        <div className="border-b border-[#efedf3] px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-bold">초기 실행 후보</h2>
          <p className="mt-1 text-xs text-[#9692a0]">
            실제 검색 수요와 AI 노출 격차는 연결 후 재정렬됩니다.
          </p>
        </div>
        <div className="divide-y divide-[#f0eef4]">
          {rows.map((item) => (
            <div
              key={item.question}
              className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[52px_1.6fr_1fr_auto] lg:items-center"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#eeeaff] text-sm font-bold text-[#5f4dd2]">
                {item.priority}
              </span>
              <div>
                <div className="text-sm font-bold leading-5">
                  {item.question}
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-[#8f8b98]">
                  {item.reason}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                {[
                  ['단계', item.stage],
                  ['근거', item.evidence],
                  ['위험', item.risk],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg bg-[#f7f6fa] px-2 py-2"
                  >
                    <div className="text-[#a09ca8]">{label}</div>
                    <div className="mt-1 font-bold text-[#5f5b68]">{value}</div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => onBrief(item.question)}
                variant="outline"
                size="sm"
              >
                <FileCheck2 className="size-3.5" /> 브리프
              </Button>
            </div>
          ))}
        </div>
      </div>
      <InfoNote>
        월 검색량과 AI 언급률이 비어 있는 것은 오류가 아닙니다. 실제 계정
        데이터가 없으므로 표시하지 않으며, Search Console과 AI API 연결 후
        기준선 결과가 채워집니다.
      </InfoNote>
    </>
  );
}

function StudioView({ question, ready }: { question: string; ready: boolean }) {
  const [stage, setStage] = useState(ready ? 1 : 0);
  const sections = [
    ['한 문장 요약', '진단이나 효과를 단정하지 않고 질문의 범위부터 설명'],
    ['상담이 필요한 시점', '공개 의료 근거를 추가하고 의료진이 표현 검수'],
    ['검사·진료 과정', '현재 운영이 확인된 위드유 공식 정보만 연결'],
    ['위드유에서 확인할 항목', '예약제·의료진·검사 등 출처가 있는 사실'],
    ['개인차·주의사항', '온라인 정보가 개별 진단을 대신하지 않는다는 안내'],
    ['출처와 검수자', '근거 URL·확인일·의료진 승인자 표시'],
  ];
  return (
    <>
      <Heading
        eyebrow="Medical Content Studio"
        title="공식 근거와 금지 표현을 함께 묶은 브리프입니다"
        description="아직 AI 생성 및 CMS 발행 연결 전입니다. 지금은 의료진이 검토할 질문·근거·위험 규칙을 먼저 확정합니다."
        action={
          <Badge
            variant="outline"
            className="h-8 gap-1.5 border-[#e0dafb] bg-[#f7f5ff] text-[#5d49d2]"
          >
            <ShieldCheck className="size-3.5" /> 의료진 승인 필수
          </Badge>
        }
      />
      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {['질문·근거 선택', '의료 브리프', '의료진 검수', 'CMS 발행'].map(
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
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white">
          <div className="border-b border-[#efedf3] p-5 sm:p-6">
            <div className="text-[10px] font-semibold text-[#8f8b99]">
              TARGET PATIENT QUESTION
            </div>
            <h2 className="mt-2 text-lg font-bold leading-7 tracking-tight">
              {question}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">위드유 의원·한의원</Badge>
              <Badge variant="outline">공식 출처 11개</Badge>
              <Badge className="bg-[#fff4e7] text-[#b76a20]">
                수요 측정 전
              </Badge>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">권장 답변 구조</h3>
              <span className="text-[10px] text-[#9995a2]">환자 언어 기준</span>
            </div>
            <div className="space-y-3">
              {sections.map(([title, detail], index) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-[#eceaf0] p-3.5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-bold text-[#5e4bd3]">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold">{title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[#9692a0]">
                      {detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
              <Button variant="outline">근거 11개 보기</Button>
              <Button
                onClick={() => setStage(2)}
                className="bg-[#6957e8] hover:bg-[#5845d5]"
              >
                검수 화면 미리보기 <ArrowRight className="size-4" />
              </Button>
            </div>
            {stage >= 2 ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#cfeadf] bg-[#f4fbf7] p-3 text-xs leading-5 text-[#247c5e]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                브리프가 의료진 검수 단계로 준비되었습니다. 실제 저장과 담당자
                배정은 데이터베이스 연결 후 활성화됩니다.
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">사용 가능한 근거</h3>
              <span className="text-lg font-bold text-[#258967]">
                {counts.source_confirmed}
              </span>
            </div>
            <div className="space-y-3">
              {[
                ['병원명·주소·연락처', true],
                ['예약제·월요일 야간진료', true],
                ['진료 분야 페이지', true],
                ['검사별 현재 운영 여부', false],
                ['의료진 자격 증빙', false],
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
                    {ok ? '사용 가능' : '확인 필요'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#f1d6df] bg-[#fffafb] p-5">
            <div className="flex items-center gap-2 text-[#bd476e]">
              <LockKeyhole className="size-4" />
              <h3 className="text-sm font-bold">자동 차단 문구</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                '92% 호전',
                '면역세포 증가',
                '국내 유일',
                '완치',
                '근원치료',
                '재발 방지',
              ].map((claim) => (
                <span
                  key={claim}
                  className="rounded-lg border border-[#f0d5d8] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#b84c57]"
                >
                  {claim}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-[#9a777d]">
              원자료와 의료·광고 검토가 끝나기 전에는 초안에도 넣지 않습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5">
            <h3 className="text-sm font-bold">발행 연결 상태</h3>
            <div className="mt-4 space-y-2">
              {[
                ['AI 초안 생성', 'API 키 필요'],
                ['의료진 승인 저장', 'DB 연결 필요'],
                ['WordPress 초안 발행', '권한 필요'],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-[#eceaf0] p-3 text-xs"
                >
                  <span className="size-2 rounded-full bg-[#e59b42]" />
                  <span className="flex-1 font-semibold">{label}</span>
                  <span className="text-[10px] text-[#9a96a3]">{status}</span>
                </div>
              ))}
            </div>
            <Button disabled className="mt-4 w-full">
              <LockKeyhole className="size-4" /> 승인·연결 후 발행
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MonitorView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [query, setQuery] = useState('');
  const rows = clinicData.monitorQuestions.filter((item) =>
    item.question.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="Answer-level Monitoring"
        title="기준선 질문은 준비됐고, 실제 AI 측정 연결을 기다립니다"
        description="API 연결 전에는 언급률과 인용률을 표시하지 않습니다. 연결 후 공급자·모델·실행시각·원문·출처까지 저장합니다."
        action={
          <Button onClick={() => onNavigate('settings')} variant="outline">
            <Link2 className="size-4" /> AI 연결 보기
          </Button>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="기준선 질문"
          value={String(clinicData.monitorQuestions.length)}
          unit="개"
          note="위드유 진료영역 기준"
          icon={MessageCircleQuestion}
          tone="bg-[#efecff] text-[#6653df]"
        />
        <Metric
          label="측정 완료"
          value="0"
          unit="개"
          note="AI API 연결 후 시작"
          icon={Target}
          tone="bg-[#fff1e6] text-[#d77832]"
        />
        <Metric
          label="예정 공급자"
          value="3"
          unit="개"
          note="OpenAI부터 순차 연결"
          icon={Bot}
          tone="bg-[#e8f7f1] text-[#218462]"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#efedf3] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aaa6b1]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="질문 검색"
              placeholder="환자 질문 검색"
              className="h-9 w-full rounded-lg border border-[#dfdde6] bg-[#fbfafc] pl-9 pr-3 text-xs outline-none focus:border-[#8170e9]"
            />
          </div>
          <Badge
            variant="outline"
            className="h-8 justify-center gap-1.5 text-[#a56a2c]"
          >
            <Clock3 className="size-3.5" /> 기준선 대기
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-[#fbfafe] text-[10px] uppercase tracking-[.05em] text-[#9995a2]">
              <tr>
                <th className="px-6 py-3">환자 질문</th>
                <th className="px-3 py-3">여정</th>
                <th className="px-3 py-3">예정 엔진</th>
                <th className="px-3 py-3">브랜드 언급</th>
                <th className="px-3 py-3">공식 페이지 인용</th>
                <th className="px-6 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eef4]">
              {rows.map((item) => (
                <tr key={item.question} className="hover:bg-[#fcfbff]">
                  <td className="max-w-[340px] px-6 py-4 font-semibold leading-5">
                    {item.question}
                  </td>
                  <td className="px-3 py-4">
                    <Badge variant="secondary">{item.stage}</Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.providers.map((provider) => (
                        <span
                          key={provider}
                          className="rounded-md bg-[#eeeaf9] px-2 py-1 text-[9px] font-bold text-[#5b48d2]"
                        >
                          {provider}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[#aaa6b1]">—</td>
                  <td className="px-3 py-4 text-[#aaa6b1]">—</td>
                  <td className="px-6 py-4 font-semibold text-[#b2702d]">
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <InfoNote>
        API 측정은 소비자가 보는 ChatGPT·Google AI 웹 화면과 완전히 같지 않을 수
        있습니다. 공급자·모델·시간 조건을 저장한 “API 기반 대리 측정”으로
        표시합니다.
      </InfoNote>
    </>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#e3defa] bg-[#f8f6ff] p-4 text-xs leading-5 text-[#6b637c]">
      <CircleHelp className="mt-0.5 size-4 shrink-0 text-[#6957e8]" />
      <span>{children}</span>
    </div>
  );
}

function KnowledgeView() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | FactStatus>('all');
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return facts.filter((fact) => {
      const byStatus = filter === 'all' || fact.status === filter;
      const byQuery =
        !normalized ||
        [fact.category, fact.label, fact.value, fact.note, fact.sourceTitle]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      return byStatus && byQuery;
    });
  }, [filter, query]);
  return (
    <>
      <Heading
        eyebrow="Hospital Knowledge Base"
        title="위드유 공식 정보를 출처와 검수 상태별로 저장했습니다"
        description="‘공식 출처 확인’은 병원 홈페이지 게시 사실을 확인했다는 뜻이며, 치료 효과가 독립적으로 검증되었다는 의미는 아닙니다."
        action={
          <a
            href={clinicData.hospital.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfdde6] bg-white px-3 text-xs font-semibold text-[#625e6c] hover:bg-[#f8f7fa]"
          >
            공식 사이트 <ExternalLink className="size-3.5" />
          </a>
        }
      />
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(statusMeta) as FactStatus[]).map((status) => {
          const meta = statusMeta[status];
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`rounded-2xl border p-4 text-left transition ${filter === status ? meta.tone : 'border-[#e8e6ee] bg-white hover:border-[#d7d2e3]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{meta.label}</span>
                <span className={`size-2 rounded-full ${meta.dot}`} />
              </div>
              <div className="mt-3 text-2xl font-bold">{counts[status]}</div>
              <p className="mt-1 text-[10px] leading-4 text-[#918d9a]">
                {meta.description}
              </p>
            </button>
          );
        })}
      </section>
      <div className="mb-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Hospital className="size-4 text-[#6957e8]" />
            <h2 className="text-[15px] font-bold">병원 기본 프로필</h2>
          </div>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ['병원명', clinicData.hospital.brandName],
              ['진료 분야', clinicData.hospital.category],
              ['주소', clinicData.hospital.address],
              ['대표전화', clinicData.hospital.phone],
              ['진료 방식', clinicData.hospital.bookingMode],
              ['수집 확인일', clinicData.hospital.collectedAt],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] font-semibold text-[#9a96a3]">
                  {label}
                </div>
                <div className="mt-1 text-xs font-semibold leading-5">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="size-4 text-[#6957e8]" />
            <h2 className="text-[15px] font-bold">의료진</h2>
          </div>
          <div className="space-y-3">
            {clinicData.practitioners.map((person) => (
              <a
                key={person.name}
                href={person.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-xl border border-[#eceaf1] p-3 hover:bg-[#fcfbff]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-xs font-bold text-[#5d49d2]">
                  {person.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">
                    {person.name} 원장
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#777381]">
                    {person.credential}
                  </span>
                  <span className="mt-1 block text-[9px] font-semibold text-[#b2702d]">
                    자격 증빙 확인 대기
                  </span>
                </span>
                <ExternalLink className="mt-1 size-3.5 text-[#aaa6b1]" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#efedf3] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aaa6b1]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="지식 검색"
              placeholder="병원명, 진료시간, 검사, 치료, 금지 표현 검색"
              className="h-9 w-full rounded-lg border border-[#dfdde6] bg-[#fbfafc] pl-9 pr-3 text-xs outline-none focus:border-[#8170e9]"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#8f8b98]">
            <RefreshCw className="size-3.5" /> {clinicData.hospital.collectedAt}{' '}
            확인
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-[#fbfafe] text-[10px] uppercase tracking-[.05em] text-[#9995a2]">
              <tr>
                <th className="px-6 py-3">분류·항목</th>
                <th className="px-3 py-3">저장된 값</th>
                <th className="px-3 py-3">검수 상태</th>
                <th className="px-3 py-3">메모</th>
                <th className="px-6 py-3">출처</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eef4]">
              {rows.map((fact) => {
                const meta = statusMeta[fact.status];
                return (
                  <tr key={fact.id} className="align-top hover:bg-[#fcfbff]">
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-[#9692a0]">
                        {fact.category}
                      </div>
                      <div className="mt-1 font-bold">{fact.label}</div>
                    </td>
                    <td className="max-w-[290px] px-3 py-4 font-medium leading-5">
                      {fact.value}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-bold ${meta.tone}`}
                      >
                        <span className={`size-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="max-w-[330px] px-3 py-4 text-[10px] leading-5 text-[#817d8a]">
                      {fact.note}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={fact.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-[#6957e8] hover:underline"
                      >
                        {fact.sourceTitle} <ExternalLink className="size-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length ? (
          <div className="p-10 text-center text-sm text-[#9692a0]">
            조건에 맞는 지식 항목이 없습니다.
          </div>
        ) : null}
      </div>
    </>
  );
}

function SettingsView() {
  const [selected, setSelected] = useState('Google Search Console');
  const current = clinicData.integrations.find(
    (item) => item.name === selected,
  );
  const guide: Record<string, string[]> = {
    '병원 홈페이지': [
      '공식 공개 페이지 11개를 등록했습니다.',
      '다음 수집부터 변경·신규 페이지를 구분합니다.',
      '후기와 상담 게시물의 개인정보는 수집하지 않습니다.',
    ],
    'Google Search Console': [
      '병원 홈페이지가 등록된 Google 계정의 OAuth 승인이 필요합니다.',
      '검색어·페이지·노출·클릭만 읽는 최소 권한으로 연결합니다.',
      '연결 후 기회 질문을 실제 수요 기준으로 재정렬합니다.',
    ],
    'AI 답변 모니터': [
      'OpenAI부터 연결하고 이후 다른 공급자를 추가합니다.',
      'API 키는 서버 비밀 저장소에만 등록합니다.',
      '질문·모델·시간·원문·인용 출처를 함께 저장합니다.',
    ],
    'WordPress CMS': [
      '현재 홈페이지에서 WordPress 구조가 감지되었습니다.',
      '새 글을 초안으로만 생성하는 최소 권한이 필요합니다.',
      '의료진 승인 전에는 발행 요청을 차단합니다.',
    ],
    '전환 측정': [
      '전화 클릭·온라인 예약·상담 완료 중 측정할 항목을 정합니다.',
      '환자정보 없이 익명 이벤트와 집계값만 저장합니다.',
      '질문→콘텐츠→유입→상담 흐름으로 성과를 연결합니다.',
    ],
  };
  return (
    <>
      <Heading
        eyebrow="Connections & Governance"
        title="위드유 실측을 시작하려면 세 가지 권한이 필요합니다"
        description="홈페이지 수집은 완료했습니다. 다음은 검색 데이터, AI 기준선, CMS 초안 발행 순서입니다. API 키와 비밀번호는 이 화면에 입력하지 않습니다."
      />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-3">
          {clinicData.integrations.map((item, index) => {
            const connected = item.status === 'connected';
            const detected = item.status === 'detected';
            return (
              <button
                key={item.name}
                onClick={() => setSelected(item.name)}
                className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition sm:p-5 ${selected === item.name ? 'border-[#cfc6fb] shadow-[0_4px_18px_rgba(90,70,200,.08)]' : 'border-[#e8e6ee] hover:border-[#d8d3e2]'}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${connected ? 'bg-[#e8f7f1] text-[#218462]' : detected ? 'bg-[#eef3ff] text-[#4f67bb]' : 'bg-[#fff2e7] text-[#cc7837]'}`}
                >
                  {index === 0 ? (
                    <Globe2 className="size-5" />
                  ) : index === 1 ? (
                    <Search className="size-5" />
                  ) : index === 2 ? (
                    <Bot className="size-5" />
                  ) : index === 3 ? (
                    <FileText className="size-5" />
                  ) : (
                    <Target className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.name}</span>
                    <span
                      className={`size-2 rounded-full ${connected ? 'bg-[#2cad77]' : detected ? 'bg-[#7185d4]' : 'bg-[#e59b42]'}`}
                    />
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#8f8b98]">
                    {item.detail}
                  </span>
                </span>
                <span className="hidden shrink-0 text-[10px] font-bold text-[#777381] sm:block">
                  {item.nextAction}
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#aaa6b1]" />
              </button>
            );
          })}
        </div>
        <div className="h-fit rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6 xl:sticky xl:top-[100px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold tracking-[.08em] text-[#9a96a3]">
                CONNECTION GUIDE
              </div>
              <h2 className="mt-1 text-lg font-bold">{selected}</h2>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-[#f0edff] text-[#5d49d2]">
              <KeyRound className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#777381]">
            {current?.detail}
          </p>
          <div className="mt-5 space-y-3">
            {(guide[selected] ?? []).map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f0edff] text-[10px] font-bold text-[#5d49d2]">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-xs leading-5 text-[#625e6c]">
                  {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[#f0dfca] bg-[#fff9ef] p-3 text-[10px] leading-5 text-[#956333]">
            <div className="mb-1 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="size-3.5" /> 보안 원칙
            </div>
            API 키·CMS 비밀번호·환자정보는 채팅이나 브라우저 코드에 저장하지
            않습니다.
          </div>
          <Button disabled className="mt-4 w-full">
            {current?.nextAction ?? '연결 준비'}
          </Button>
          <p className="mt-2 text-center text-[9px] text-[#aaa6b1]">
            보안 저장소 준비 후 활성화됩니다.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
        <h2 className="text-[15px] font-bold">권장 연결 순서</h2>
        <p className="mt-1 text-xs text-[#9692a0]">
          검색 수요를 확인하고 AI 기준선을 측정한 뒤 승인된 초안만 CMS로
          보냅니다.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#625e6c]">
          {[
            '병원 검수',
            'Search Console',
            'OpenAI',
            'WordPress',
            '전환 측정',
          ].map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span className="rounded-lg bg-[#f1eff6] px-2.5 py-1.5">
                {index + 1}. {item}
              </span>
              {index < 4 ? (
                <ArrowRight className="size-3 text-[#b4b0bb]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
