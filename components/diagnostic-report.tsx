'use client';

import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CircleAlert,
  FileCheck2,
  FileDown,
  FileText,
  Globe2,
  Link2,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import clinicData from '@/data/withyou-clinic.json';

const baseline = clinicData.publicWebBaseline;
const draft = clinicData.contentDraft;
const opportunities = clinicData.opportunities;

const factCounts = clinicData.facts.reduce(
  (result, fact) => {
    result[fact.status as keyof typeof result] += 1;
    return result;
  },
  {
    source_confirmed: 0,
    medical_review_required: 0,
    needs_confirmation: 0,
    blocked_claim: 0,
  },
);

const statusRows = [
  {
    label: '공식 출처 확인',
    value: factCounts.source_confirmed,
    color: '#2cad77',
  },
  {
    label: '의료진 검수',
    value: factCounts.medical_review_required,
    color: '#7562e8',
  },
  {
    label: '병원 확인 필요',
    value: factCounts.needs_confirmation,
    color: '#e59b42',
  },
  {
    label: '콘텐츠 사용 차단',
    value: factCounts.blocked_claim,
    color: '#dc5962',
  },
];

function ReportHeader({ section }: { section: string }) {
  return (
    <div className="mb-7 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-[#6957e8] text-white">
          <Target className="size-4" />
        </span>
        <div>
          <div className="text-[11px] font-black tracking-[-.02em]">
            MediAnswer
          </div>
          <div className="text-[7px] font-bold tracking-[.16em] text-[#9a96a3]">
            HOSPITAL AEO DIAGNOSTIC
          </div>
        </div>
      </div>
      <div className="text-[8px] font-bold tracking-[.16em] text-[#6957e8]">
        {section}
      </div>
    </div>
  );
}

function ReportFooter({
  page,
  source,
  dark = false,
}: {
  page: number;
  source: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`absolute inset-x-10 bottom-7 flex items-end justify-between gap-6 text-[7px] ${dark ? 'text-white/45' : 'text-[#9c98a6]'}`}
    >
      <span className="max-w-[78%] leading-3">출처: {source}</span>
      <span className="font-bold tracking-[.1em]">
        {String(page).padStart(2, '0')} / 08
      </span>
    </div>
  );
}

function ReportPage({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`report-sheet relative mx-auto overflow-hidden rounded-[22px] border border-[#e5e3ea] bg-[#fbfbfa] p-10 shadow-[0_24px_70px_rgba(34,30,52,.12)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  index,
  title,
  accent,
  description,
  dark = false,
}: {
  index: string;
  title: string;
  accent?: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-[8px] font-black tracking-[.2em] ${dark ? 'text-[#b9adff]' : 'text-[#6957e8]'}`}
      >
        {index}
      </div>
      <h2
        className={`mt-2 text-[28px] font-black leading-tight tracking-[-.045em] ${dark ? 'text-white' : 'text-[#20202a]'}`}
      >
        {title}{' '}
        {accent ? (
          <span className={dark ? 'text-[#a999ff]' : 'text-[#6957e8]'}>
            {accent}
          </span>
        ) : null}
      </h2>
      <p
        className={`mt-2 max-w-4xl text-[10px] leading-5 ${dark ? 'text-white/55' : 'text-[#777381]'}`}
      >
        {description}
      </p>
    </div>
  );
}

function MiniCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'purple',
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
  tone?: 'purple' | 'green' | 'orange' | 'red';
}) {
  const tones = {
    purple: 'bg-[#f2efff] text-[#6957e8]',
    green: 'bg-[#e8f7f1] text-[#218462]',
    orange: 'bg-[#fff1e6] text-[#d77832]',
    red: 'bg-[#fff0f1] text-[#c94c57]',
  };
  return (
    <div className="rounded-2xl border border-[#e6e4ea] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold text-[#777381]">{label}</span>
        <span
          className={`grid size-7 place-items-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 text-[27px] font-black leading-none tracking-[-.05em]">
        {value}
      </div>
      <div className="mt-2 text-[8px] leading-4 text-[#8f8b98]">{note}</div>
    </div>
  );
}

export function DiagnosticReport({ onBack }: { onBack: () => void }) {
  const printReport = async () => {
    const previousTitle = document.title;
    const reportTitle = `${clinicData.hospital.shortName}_AEO_진단보고서_${baseline.collectedAt.replaceAll('-', '')}`;
    const restoreTitle = () => {
      document.title = previousTitle;
    };
    document.title = reportTitle;
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.addEventListener('afterprint', restoreTitle, { once: true });
    window.print();
    window.setTimeout(restoreTitle, 1500);
  };

  return (
    <div className="report-print-root">
      <div className="report-no-print sticky top-[88px] z-20 mb-5 flex flex-col gap-3 rounded-2xl border border-[#e4e1ed] bg-white/95 p-4 shadow-[0_12px_40px_rgba(37,31,64,.12)] backdrop-blur sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> 대시보드로 돌아가기
        </Button>
        <div className="min-w-0 flex-1 sm:border-l sm:border-[#e8e6ee] sm:pl-4">
          <div className="text-xs font-bold">위드유 AEO 진단 보고서</div>
          <div className="mt-1 text-[10px] text-[#8f8b98]">
            8페이지 · 인쇄 창에서 ‘PDF로 저장’을 선택하세요.
          </div>
        </div>
        <Button
          onClick={printReport}
          className="bg-[#6957e8] hover:bg-[#5845d5]"
        >
          <FileDown className="size-4" /> PDF로 저장·인쇄
        </Button>
      </div>

      <div className="report-document space-y-7 overflow-x-auto pb-10">
        <ReportPage className="bg-[linear-gradient(135deg,#fbfbfa_0%,#f6f4ff_62%,#ece8ff_100%)]">
          <div className="absolute -right-24 -top-32 size-[420px] rounded-full bg-[#6957e8]/10 blur-3xl" />
          <div className="relative grid h-full grid-cols-[1.15fr_.85fr] gap-10">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[8px] font-black tracking-[.2em] text-[#6957e8]">
                  <span className="h-4 w-1 rounded-full bg-[#6957e8]" />
                  {clinicData.hospital.category} · GEO · AEO · SEO REPORT
                </div>
                <h1 className="mt-8 text-[44px] font-black leading-[1.08] tracking-[-.055em] text-[#1e1d25]">
                  {clinicData.hospital.brandName}
                  <br />
                  <span className="text-[#6957e8]">AI 검색 노출</span>
                  <br />
                  진단 보고서
                </h1>
                <p className="mt-6 max-w-xl text-[12px] font-semibold leading-6 text-[#5f5b68]">
                  공식 홈페이지의 정보를 AI가 더 쉽게 이해하고 인용하도록, 현재
                  노출 공백과 첫 콘텐츠 실행안을 근거 중심으로 정리했습니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-[#dcd8e7] pt-5 text-[8px]">
                <div>
                  <div className="font-bold tracking-[.16em] text-[#a09ba9]">
                    TARGET HOSPITAL
                  </div>
                  <div className="mt-1 font-bold text-[#2c2a32]">
                    {clinicData.hospital.brandName}
                  </div>
                </div>
                <div>
                  <div className="font-bold tracking-[.16em] text-[#a09ba9]">
                    PREPARED BY
                  </div>
                  <div className="mt-1 font-bold text-[#2c2a32]">
                    MediAnswer
                  </div>
                </div>
                <div>
                  <div className="font-bold tracking-[.16em] text-[#a09ba9]">
                    SOURCE SCOPE
                  </div>
                  <div className="mt-1 font-bold text-[#2c2a32]">
                    공식 홈페이지 공개 정보
                  </div>
                </div>
                <div>
                  <div className="font-bold tracking-[.16em] text-[#a09ba9]">
                    DIAGNOSED ON
                  </div>
                  <div className="mt-1 font-bold text-[#2c2a32]">
                    {baseline.collectedAt}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-[28px] bg-[#252331] p-7 text-white shadow-[0_24px_70px_rgba(39,34,64,.24)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#6957e8]">
                    <Target className="size-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-black">MediAnswer</div>
                    <div className="text-[7px] tracking-[.14em] text-white/45">
                      EVIDENCE-LED AEO
                    </div>
                  </div>
                </div>
                <Badge className="bg-white/10 text-[7px] text-white">
                  CURRENT DIAGNOSIS
                </Badge>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[.16em] text-[#b9adff]">
                  핵심 진단
                </div>
                <div className="mt-3 text-[30px] font-black leading-tight tracking-[-.045em]">
                  브랜드 검색은 확인,
                  <br />
                  비브랜드 질문은
                  <br />
                  공식 답변 공백
                </div>
                <p className="mt-4 text-[10px] leading-5 text-white/55">
                  공개 결과군 5개 중 공식 도메인은 1개에서 확인됐고, 비브랜드
                  환자 질문 4개에서는 확인되지 않았습니다.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['5', '확인 질문'],
                  ['4', '노출 공백'],
                  [String(clinicData.facts.length), '지식 레코드'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-white/[.07] p-3">
                    <div className="text-xl font-black text-[#b9adff]">
                      {value}
                    </div>
                    <div className="mt-1 text-[7px] text-white/45">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ReportFooter
            page={1}
            source={`위드유 공식 홈페이지 · ${baseline.collectedAt} 공개 정보 기준`}
          />
        </ReportPage>

        <ReportPage>
          <ReportHeader section="01 · EXECUTIVE SUMMARY" />
          <SectionTitle
            index="1. 핵심 요약"
            title="지금은 무엇이 보이고,"
            accent="무엇이 비어 있는가"
            description="확인된 사실과 아직 연결되지 않은 측정을 분리해 현재 상태를 한눈에 정리했습니다."
          />
          <div className="mt-7 grid grid-cols-4 gap-3">
            <MiniCard
              label="공개 검색 확인"
              value={`${baseline.summary.queries}개`}
              note="같은 시점의 공개 검색 결과군"
              icon={Search}
            />
            <MiniCard
              label="공식 도메인 확인"
              value={`${baseline.summary.officialDomainPresent}개`}
              note="브랜드명을 포함한 질문에서 확인"
              icon={Globe2}
              tone="green"
            />
            <MiniCard
              label="비브랜드 노출 공백"
              value={`${baseline.summary.nonBrandGaps}개`}
              note="콘텐츠로 메울 우선 질문"
              icon={Target}
              tone="orange"
            />
            <MiniCard
              label="AI 실측"
              value="측정 전"
              note="API 연결 후 기준선 수집"
              icon={Bot}
              tone="red"
            />
          </div>
          <div className="mt-4 grid grid-cols-[1.2fr_.8fr] gap-4">
            <div className="rounded-2xl border border-[#e6e4ea] bg-white p-5">
              <h3 className="text-[12px] font-black">진단 결론</h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  [
                    '확인됨',
                    '브랜드명 검색에서는 공식 홈페이지와 핵심 진료 페이지가 확인됩니다.',
                    'bg-[#e9f7f1] text-[#218462]',
                  ],
                  [
                    '가장 큰 공백',
                    '병원을 모르는 환자의 검사·질환 비교 질문에서 공식 도메인이 보이지 않습니다.',
                    'bg-[#fff2e8] text-[#bd6729]',
                  ],
                  [
                    '첫 실행',
                    '검사 선택 기준과 결과 해석 한계를 담은 의료진 감수 콘텐츠가 우선입니다.',
                    'bg-[#f0edff] text-[#5d49d2]',
                  ],
                ].map(([label, text, tone]) => (
                  <div key={label} className="rounded-xl bg-[#faf9fc] p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[7px] font-bold ${tone}`}
                    >
                      {label}
                    </span>
                    <p className="mt-3 text-[9px] font-medium leading-[1.65] text-[#5f5b68]">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[#252331] p-5 text-white">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#c4baff]">
                <ShieldCheck className="size-4" /> 데이터 신뢰 원칙
              </div>
              <ul className="mt-4 space-y-3 text-[9px] leading-[1.6] text-white/65">
                <li>• 검색량이나 AI 순위를 임의로 생성하지 않습니다.</li>
                <li>• AI API 연결 전 값은 ‘측정 전’으로 표시합니다.</li>
                <li>• 의료진 승인 전 효과 주장을 발행하지 않습니다.</li>
                <li>• 숫자마다 질문·시각·출처 URL을 함께 보관합니다.</li>
              </ul>
            </div>
          </div>
          <ReportFooter
            page={2}
            source="공개 웹 기준선 · 공식 홈페이지 지식베이스 · 연결 상태"
          />
        </ReportPage>

        <ReportPage>
          <ReportHeader section="02 · PUBLIC WEB BASELINE" />
          <SectionTitle
            index="2. 공개 웹 기준선"
            title="브랜드 검색은 확인,"
            accent="비브랜드 질문 4개는 공백"
            description={`${baseline.collectedAt} 공개 검색 결과군을 직접 확인했습니다. 이는 검색량·지도팩·실제 AI 답변 순위가 아닙니다.`}
          />
          <div className="mt-6 grid grid-cols-[1.55fr_.45fr] gap-4">
            <div className="overflow-hidden rounded-2xl border border-[#e3e1e8] bg-white">
              <table className="w-full table-fixed text-left text-[8px]">
                <thead className="bg-[#252331] text-white">
                  <tr>
                    <th className="w-[32%] px-4 py-3">실행 검색어</th>
                    <th className="w-[15%] px-3 py-3">여정</th>
                    <th className="w-[13%] px-3 py-3">공식 도메인</th>
                    <th className="px-3 py-3">진단 및 조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceaf0]">
                  {baseline.rows.map((item) => (
                    <tr key={item.query} className="align-top">
                      <td className="px-4 py-3 font-bold leading-4">
                        {item.query}
                      </td>
                      <td className="px-3 py-3 text-[#777381]">{item.stage}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-bold ${item.officialDomainPresent ? 'bg-[#e8f7f1] text-[#218462]' : 'bg-[#fff0e7] text-[#bd6729]'}`}
                        >
                          {item.officialDomainPresent ? (
                            <Check className="size-2.5" />
                          ) : (
                            <CircleAlert className="size-2.5" />
                          )}
                          {item.officialDomainPresent ? '확인' : '미확인'}
                        </span>
                      </td>
                      <td className="px-3 py-3 leading-4 text-[#5f5b68]">
                        {item.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-[#252331] p-6 text-white">
              <div>
                <div className="text-[8px] font-bold tracking-[.16em] text-[#b9adff]">
                  NON-BRAND GAP
                </div>
                <div className="mt-3 text-[46px] font-black leading-none text-[#ffb068]">
                  0 / 4
                </div>
                <div className="mt-2 text-[11px] font-bold">
                  비브랜드 공식 도메인 확인
                </div>
                <p className="mt-4 text-[9px] leading-5 text-white/55">
                  병원을 이미 아는 검색보다, 검사와 질환을 먼저 묻는 신규 환자
                  질문에 답할 공식 원문이 부족합니다.
                </p>
              </div>
              <div className="rounded-xl bg-white/[.07] p-4 text-[9px] leading-5 text-white/65">
                <div className="font-bold text-white">해결 방향</div>
                질문에 먼저 답하는 건강정보 원문을 공식 도메인에 발행하고 관련
                진료 페이지에서 내부 링크합니다.
              </div>
            </div>
          </div>
          <ReportFooter
            page={3}
            source={`${baseline.method} · ${baseline.collectedAt} · 개인화 및 실제 AI 답변 순위 제외`}
          />
        </ReportPage>

        <ReportPage className="bg-[#171b2b] text-white">
          <ReportHeader section="03 · AI MEASUREMENT STATUS" />
          <SectionTitle
            index="3. AI 측정 상태"
            title="현재 AI 성과는"
            accent="연결 전 · 측정 전"
            description="실제 응답을 수집하기 전에는 0%로 그리지 않습니다. 아래 질문 세트로 동일 조건 기준선을 먼저 만듭니다."
            dark
          />
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              ['AI 브랜드 언급률', '—', '유효 답변 중 브랜드 언급'],
              ['AI 노출 점유율', '—', '비교 브랜드 전체 언급 중 비중'],
              ['공식 도메인 인용률', '—', '출처 확인 가능 답변만 분모'],
              ['AI 추천 유입', '—', '사람의 실제 방문 세션'],
            ].map(([label, value, note]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[.045] p-4"
              >
                <div className="text-[9px] font-bold text-white/60">
                  {label}
                </div>
                <div className="mt-3 text-[32px] font-black text-[#b9adff]">
                  {value}
                </div>
                <div className="mt-2 text-[7px] leading-4 text-white/40">
                  {note}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[1.2fr_.8fr] gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black">기준선 질문 대기열</h3>
                <Badge className="bg-[#332f4a] text-[7px] text-[#c4baff]">
                  {clinicData.monitorQuestions.length} QUESTIONS
                </Badge>
              </div>
              <div className="mt-3 divide-y divide-white/10">
                {clinicData.monitorQuestions.map((item, index) => (
                  <div
                    key={item.question}
                    className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5"
                  >
                    <span className="grid size-5 place-items-center rounded-full bg-[#6957e8] text-[7px] font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-[8px] font-semibold">
                        {item.question}
                      </div>
                      <div className="mt-1 text-[7px] text-white/35">
                        {item.stage}
                      </div>
                    </div>
                    <div className="text-right text-[7px] text-[#b9adff]">
                      {item.providers.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#6f5ce6]/40 bg-[#23233a] p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#b9adff]">
                <Bot className="size-4" /> 측정 후 증명할 것
              </div>
              <ol className="mt-4 space-y-3 text-[8px] leading-[1.6] text-white/60">
                <li>01 · 같은 질문·모델·언어·지역으로 발행 전 28일 측정</li>
                <li>02 · 콘텐츠 발행일과 최종 원문 URL 기록</li>
                <li>03 · D+8~35일 동일 조건 재측정</li>
                <li>04 · 비교 질문군의 자연 변화를 제외해 추정 기여 계산</li>
                <li>05 · AI 방문과 크롤러 요청을 별도 집계</li>
              </ol>
            </div>
          </div>
          <ReportFooter
            page={4}
            source="AI 답변 모니터 연결 전 · 측정값 미생성"
            dark
          />
        </ReportPage>

        <ReportPage>
          <ReportHeader section="04 · KNOWLEDGE READINESS" />
          <SectionTitle
            index="4. 병원 지식 준비도"
            title={`${clinicData.facts.length}개 지식 레코드,`}
            accent={`${factCounts.blocked_claim}개 위험 표현 차단`}
            description="공식 홈페이지에서 확인한 사실과 의료진 검수가 필요한 내용을 분리해 콘텐츠 안전성을 확보합니다."
          />
          <div className="mt-6 grid grid-cols-[.75fr_1.25fr] gap-4">
            <div className="rounded-2xl border border-[#e6e4ea] bg-white p-5">
              <h3 className="text-[11px] font-black">검수 상태</h3>
              <div className="mt-5 space-y-4">
                {statusRows.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-black">{item.value}개</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#efedf3]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((item.value / clinicData.facts.length) * 100, 4)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[#f3f1ff] p-4 text-[8px] leading-4 text-[#625a7c]">
                의료진 승인 전에는 자격·효과·검사 적응증을 확정 표현으로
                발행하지 않습니다.
              </div>
            </div>
            <div className="grid grid-rows-[auto_1fr] gap-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniCard
                  label="등록한 공식 페이지"
                  value={`${clinicData.sources.length}개`}
                  note="기본정보·의료진·질환·검사·치료"
                  icon={Link2}
                />
                <MiniCard
                  label="첫 콘텐츠 근거"
                  value={`${draft.evidenceSources.length}개`}
                  note="공식 지침과 병원 기존 안내"
                  icon={FileCheck2}
                  tone="green"
                />
                <MiniCard
                  label="검수 체크"
                  value={`${draft.reviewChecklist.length}개`}
                  note="의료진이 확인할 발행 조건"
                  icon={ShieldCheck}
                  tone="orange"
                />
              </div>
              <div className="rounded-2xl border border-[#edd8dc] bg-[#fffafb] p-5">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="size-4 text-[#c94c57]" />
                  <h3 className="text-[11px] font-black">
                    우선 정리할 신뢰 신호
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {baseline.siteSignals.map((signal) => (
                    <div key={signal.title} className="rounded-xl bg-white p-3">
                      <div className="text-[8px] font-bold text-[#9c4550]">
                        {signal.title}
                      </div>
                      <p className="mt-2 text-[7px] leading-4 text-[#777381]">
                        {signal.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <ReportFooter
            page={5}
            source={`공식 홈페이지 ${clinicData.sources.length}개 페이지 · 지식베이스 ${clinicData.facts.length}개 레코드`}
          />
        </ReportPage>

        <ReportPage>
          <ReportHeader section="05 · GROWTH OPPORTUNITIES" />
          <SectionTitle
            index="5. 성장 기회"
            title="검색량을 추측하지 않고,"
            accent="답변 공백부터 우선순위화"
            description="환자의 의사결정에 도움이 되고 공식 근거를 확보할 수 있는 질문을 먼저 콘텐츠로 전환합니다."
          />
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#e3e1e8] bg-white">
            <table className="w-full table-fixed text-left text-[8px]">
              <thead className="bg-[#252331] text-white">
                <tr>
                  <th className="w-[8%] px-4 py-3">순위</th>
                  <th className="w-[34%] px-3 py-3">환자 질문</th>
                  <th className="w-[14%] px-3 py-3">여정</th>
                  <th className="w-[15%] px-3 py-3">근거·위험</th>
                  <th className="px-3 py-3">선정 이유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceaf0]">
                {opportunities.map((item) => (
                  <tr key={item.priority} className="align-top">
                    <td className="px-4 py-3">
                      <span className="grid size-6 place-items-center rounded-full bg-[#efecff] font-black text-[#6957e8]">
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold leading-4">
                      {item.question}
                    </td>
                    <td className="px-3 py-3 text-[#777381]">{item.stage}</td>
                    <td className="px-3 py-3 leading-4 text-[#5f5b68]">
                      근거 {item.evidence} · 위험 {item.risk}
                    </td>
                    <td className="px-3 py-3 leading-4 text-[#5f5b68]">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-[1.4fr_.6fr] gap-4">
            <div className="rounded-2xl border border-[#e6e4ea] bg-[#f8f7ff] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black text-[#5d49d2]">
                <Sparkles className="size-4" /> 첫 콘텐츠 선정 기준
              </div>
              <p className="mt-2 text-[8px] leading-4 text-[#675f78]">
                공개 결과에서 공식 도메인이 보이지 않고, 환자가 검사 필요 여부를
                판단하는 데 직접 도움을 주며, 공신력 있는 진료지침 근거가 충분한
                질문을 1순위로 선정했습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-[#252331] p-4 text-white">
              <div className="text-[8px] font-bold text-[#b9adff]">
                KEYWORD DATA
              </div>
              <div className="mt-2 text-lg font-black">연결 필요</div>
              <p className="mt-1 text-[7px] leading-4 text-white/45">
                Search Console 연결 후 실제 노출·클릭 데이터로 재정렬합니다.
              </p>
            </div>
          </div>
          <ReportFooter
            page={6}
            source="공개 결과군의 콘텐츠 공백 · 공식 근거 확보 가능성 · 의료 위험도"
          />
        </ReportPage>

        <ReportPage>
          <ReportHeader section="06 · FIRST CONTENT ACTION" />
          <SectionTitle
            index="6. 첫 콘텐츠 실행안"
            title="첫 공식 원문 :"
            accent="아토피·알레르기 검사 가이드"
            description="메디앤서가 초안을 준비하고 의료진이 최종 검수한 뒤 위드유 공식 도메인의 건강정보 상세 페이지에 발행합니다."
          />
          <div className="mt-6 grid grid-cols-[1.2fr_.8fr] gap-4">
            <div className="rounded-2xl border border-[#e3e1e8] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="bg-[#f0edff] text-[7px] text-[#5d49d2]">
                    의료진 검수 전 초안
                  </Badge>
                  <h3 className="mt-3 text-[17px] font-black leading-tight tracking-[-.025em]">
                    {draft.h1}
                  </h3>
                </div>
                <FileText className="size-6 shrink-0 text-[#6957e8]" />
              </div>
              <div className="mt-4 rounded-xl bg-[#f8f7fb] p-4">
                <div className="text-[8px] font-black text-[#5d49d2]">
                  핵심 답변
                </div>
                <p className="mt-2 text-[8px] leading-[1.65] text-[#5f5b68]">
                  {draft.directAnswer}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {draft.sections.slice(0, 6).map((section, index) => (
                  <div
                    key={section.heading}
                    className="flex items-start gap-2 rounded-lg border border-[#eceaf0] p-3"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#efecff] text-[7px] font-black text-[#6957e8]">
                      {index + 1}
                    </span>
                    <span className="text-[7px] font-semibold leading-4">
                      {section.heading}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#252331] p-5 text-white">
                <div className="text-[9px] font-bold text-[#b9adff]">
                  발행 위치
                </div>
                <div className="mt-2 text-[13px] font-black">
                  위드유 공식 도메인
                </div>
                <div className="mt-2 rounded-lg bg-white/[.07] px-3 py-2 font-mono text-[7px] text-white/60">
                  withyouclinic.com/health-guide/atopy-allergy-test/
                </div>
                <p className="mt-3 text-[8px] leading-4 text-white/50">
                  홈페이지 메인에는 글 전체가 아니라 제목·요약·상세 페이지
                  링크만 노출합니다.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6e4ea] bg-white p-5">
                <div className="text-[9px] font-black">발행 전 필수 검수</div>
                <ul className="mt-3 space-y-2 text-[7px] leading-4 text-[#686472]">
                  {draft.reviewChecklist.slice(0, 5).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#e59b42]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <ReportFooter
            page={7}
            source={`콘텐츠 초안 ${draft.id} · 근거 ${draft.evidenceSources.length}개 · 의료진 승인 전`}
          />
        </ReportPage>

        <ReportPage className="bg-[linear-gradient(145deg,#252331_0%,#302b4a_62%,#493d83_100%)] text-white">
          <ReportHeader section="07 · 90-DAY ROADMAP" />
          <SectionTitle
            index="7. 실행 로드맵"
            title="90일 안에 기준선부터"
            accent="첫 성과 비교까지"
            description="연결·검수·발행·재측정을 한 흐름으로 운영합니다. 목표 수치는 실제 기준선이 쌓인 뒤 정합니다."
            dark
          />
          <div className="relative mt-14">
            <div className="absolute left-[8%] right-[8%] top-5 h-px bg-gradient-to-r from-[#6957e8] via-[#a999ff] to-[#48b992]" />
            <div className="relative grid grid-cols-4 gap-3">
              {[
                {
                  period: '1~2주',
                  title: '측정 기반 연결',
                  items: [
                    'Search Console 승인',
                    'AI 답변 모니터 연결',
                    '방문 분석 연결',
                  ],
                },
                {
                  period: '3~4주',
                  title: '첫 원문 발행',
                  items: [
                    '의료진 검수 완료',
                    '공식 도메인 발행',
                    '관련 페이지 내부 링크',
                  ],
                },
                {
                  period: '5~8주',
                  title: '반영·재측정',
                  items: [
                    '동일 질문 반복 측정',
                    '공식 인용 URL 확인',
                    'AI 추천 방문 분리',
                  ],
                },
                {
                  period: '9~12주',
                  title: '성과 기반 확장',
                  items: [
                    '발행 전후 변화 계산',
                    '상승 질문 구조 확장',
                    '다음 콘텐츠 재정렬',
                  ],
                },
              ].map((step, index) => (
                <div key={step.period}>
                  <div className="mx-auto grid size-10 place-items-center rounded-full border-4 border-[#302b4a] bg-[#6957e8] text-[8px] font-black shadow-[0_0_0_1px_rgba(185,173,255,.45)]">
                    {step.period}
                  </div>
                  <div className="mt-5 min-h-[150px] rounded-2xl border border-white/10 bg-white/[.06] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black">
                        {step.title}
                      </span>
                      <span className="text-[8px] text-[#b9adff]">
                        0{index + 1}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-[8px] leading-4 text-white/55">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <ArrowRight className="mt-0.5 size-3 shrink-0 text-[#a999ff]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4">
            <div>
              <div className="text-[8px] font-bold text-[#b9adff]">
                NEXT ACTION
              </div>
              <div className="mt-1 text-[13px] font-black">
                권한 연결 → 의료진 검수 → 첫 콘텐츠 발행
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#6957e8] px-4 py-2 text-[8px] font-bold">
              MediAnswer와 시작하기 <ArrowRight className="size-3" />
            </div>
          </div>
          <ReportFooter
            page={8}
            source="실행 로드맵 제안 · 목표 수치는 실측 기준선 확보 후 협의"
            dark
          />
        </ReportPage>
      </div>

      <div className="report-no-print mt-2 flex items-center justify-between rounded-xl border border-[#e6e4ea] bg-white p-4 text-[10px] text-[#777381]">
        <span className="inline-flex items-center gap-2">
          <Printer className="size-4 text-[#6957e8]" /> 인쇄 창에서 배경
          그래픽을 켜면 화면과 같은 색상으로 저장됩니다.
        </span>
        <Button size="sm" variant="outline" onClick={printReport}>
          <FileDown className="size-3.5" /> PDF 저장
        </Button>
      </div>
    </div>
  );
}
