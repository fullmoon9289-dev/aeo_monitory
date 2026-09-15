'use client';
import { useState } from 'react';
import { Activity, ArrowRight, CircleHelp, FileCheck2, MessageCircleQuestion, ShieldAlert, Target } from 'lucide-react';
import { Heading } from '@/components/dashboard-primitives';
import { Button } from '@/components/ui/button';
import clinicData from '@/data/withyou-clinic.json';
import type { Opportunity, QuestionSet } from '@/lib/question-opportunities';
import type { WorkspaceView } from '@/lib/workspace-navigation';

export function JourneyStrip({ compact = false, items }: { compact?: boolean; items?: Opportunity[] }) {
  const steps = items ? clinicData.journey.map(step => {
    const matches = items.filter(item => (item.stage === '치료 관리' ? '치료 비교' : item.stage) === step.stage);
    return { ...step, tracked: matches.length, readiness: items.length ? Math.round(matches.length / items.length * 100) : 0, question: matches[0]?.question ?? '이번 자료의 해당 단계 질문 없음', status: '질문 분포' };
  }) : clinicData.journey;
  return (
    <div
      className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-1 md:grid-cols-5'}`}
    >
      {steps.map((step, index) => (
        <div
          key={step.stage}
          className="relative rounded-xl border border-[#eceaf1] bg-[#fcfbfd] p-3.5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#85818f]">
              {index + 1}. {step.stage}
            </span>
            <span className="text-[10px] font-bold text-[#6653df]">
              {step.readiness}{items ? '%' : ''}
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

export function JourneyView({
  clinicName = '위드유',
  onNavigate,
  onBrief,
  items,
  description,
  questionSet,
}: {
  clinicName?: string;
  onNavigate: (view: WorkspaceView) => void;
  onBrief: (question: string) => void;
  items: Opportunity[];
  description: string;
  questionSet: QuestionSet | null;
}) {
  return (
    <>
      <Heading
        eyebrow="Patient Question Journey"
        title={`${clinicName === '위드유' ? '위드유를' : `${clinicName}을`} 찾기 전 환자가 묻는 질문을 정리했습니다`}
        description={description}
        action={
          <Button
            onClick={() => onNavigate('opportunities')}
            className="bg-[#6957e8] hover:bg-[#5845d5]"
          >
            기회 {items.length}개 보기 <ArrowRight className="size-4" />
          </Button>
        }
      />
      <div className="mb-5 rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6">
        <JourneyStrip items={items} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Insight
          icon={Target}
          title="먼저 검토할 질문 단계"
          value={items[0]?.stage ?? '검색 자료 필요'}
          description={items[0]?.question ?? '진료 관련 검색어가 확보되면 질문 후보가 표시됩니다.'}
          tone="border-[#ded8fb] bg-[#faf9ff] text-[#5d49d2]"
        />
        <Insight
          icon={MessageCircleQuestion}
          title="질문 세트 갱신 상태"
          value={questionSet?.source ? questionSet.refreshDue ? '새 자료 필요' : '검색 자료 반영' : '초기 제안'}
          description={questionSet?.source ? `${questionSet.source.startDate} ~ ${questionSet.source.endDate} 검색어 기준입니다. 위 막대는 단계별 질문 비중입니다.` : '매주 최근 28일 검색어 CSV를 저장해 주세요. 위 막대는 초기 제안의 단계별 질문 비중입니다.'}
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
        <h2 className="text-[15px] font-bold">{questionSet?.source ? '검색어 기반 질문 세트' : '초기 질문 세트'} · {items.length}개</h2>
        <p className="mt-1 text-xs text-[#9692a0]">
          {items.length ? `${questionSet?.source ? '검색어' : '공식 홈페이지'}를 바탕으로 구성한 기획 제안입니다. 선택하면 콘텐츠 준비 화면을 엽니다.` : '이번 자료에는 선정 기준에 맞는 질문이 없습니다. 서치콘솔 분석에서 최근 검색어 자료를 확인해 주세요.'}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
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

export function Insight({
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

export function OpportunitiesView({
  onBrief,
  items,
  description,
  questionSet,
}: {
  onBrief: (question: string) => void;
  items: Opportunity[];
  description: string;
  questionSet: QuestionSet | null;
}) {
  const [filter, setFilter] = useState('전체');
  const effectiveFilter = filter === '전체' || items.some(item => item.stage === filter) ? filter : '전체';
  const rows = items.filter(
    (row) => effectiveFilter === '전체' || row.stage === effectiveFilter,
  );
  return (
    <>
      <Heading
        eyebrow="Evidence-led Opportunity"
        title={questionSet?.source ? '검색어를 바탕으로 필요한 콘텐츠 질문을 골랐습니다' : '홈페이지 분석으로 정한 초기 기회 질문입니다'}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            {['전체', ...new Set(items.map(item => item.stage))].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`h-9 rounded-lg border px-3 text-xs font-semibold ${effectiveFilter === item ? 'border-[#6957e8] bg-[#f0edff] text-[#5946d4]' : 'border-[#e2dfe8] bg-white text-[#777381]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white">
        <div className="border-b border-[#efedf3] px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-bold">{questionSet?.source ? '검색어 기반 실행 후보' : '초기 실행 후보'} · {rows.length}개</h2>
          <p className="mt-1 text-xs text-[#9692a0]">
            {questionSet?.source ? '노출·클릭률·평균 순위와 진료 관련성으로 정한 내부 우선순위입니다. 기획 제안은 최대 30개이며, 새 자료가 저장되면 다시 계산합니다.' : '최근 검색어 CSV를 저장하면 고정된 5개 목록 대신 자료에 맞는 후보를 보여줍니다.'}
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
        검색어 노출수는 해당 병원 사이트가 검색 결과에 나온 횟수입니다. 전체 시장 검색량이나 AI 언급률이 아닙니다. 병원명 검색·진료 무관 검색어·노출 10회 미만은 제외합니다. 비교 조건이 확인된 이전 자료가 없어 증가율은 계산하지 않습니다. AI 성과 비교에 사용하는 기준 질문은 별도로 유지합니다.
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
