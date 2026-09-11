import withyou from '@/data/withyou-clinic.json';

export type ClinicId = 'withyou-clinic' | 'goldman-clinic';
export const clinics = {
  'withyou-clinic': { name: '위드유 의원·한의원', url: 'https://withyouclinic.com/', domain: 'withyouclinic.com' },
  'goldman-clinic': { name: '골드만 비뇨의학과', url: 'https://www.gold-man.com/', domain: 'gold-man.com' },
} as const;

export function isClinicId(value: unknown): value is ClinicId {
  return value === 'withyou-clinic' || value === 'goldman-clinic';
}

export const goldmanQuestions = [
  { question: '전립선비대증은 언제 약물 대신 수술을 고려하나요?', path: '/docs/prostate/bph-medication-vs-surgery.html', intent: '치료 선택', action: '선택 기준을 먼저 답하고, 진단·치료 안내로 연결합니다.' },
  { question: '전립선비대증 수술 후 일상 복귀는 언제 가능한가요?', path: '/docs/prostate/bph-surgery-recovery.html', intent: '수술 이후', action: '술식별 차이와 개인차, 진료가 필요한 증상을 구분합니다.' },
  { question: '옆구리 통증이 있으면 요로결석을 의심해야 하나요?', path: '/docs/stone/stone-symptom.html', intent: '증상 이해', action: '가능한 원인과 검사 안내를 함께 제공하고 자가진단을 피합니다.' },
  { question: '혈뇨가 보이면 어떤 검사를 받아야 하나요?', path: '/docs/voiding/hematuria-overview.html', intent: '검사 준비', action: '증상 설명에서 검사·진료 안내로 이어지는 경로를 점검합니다.' },
  { question: '골드만은 어느 지점에서 언제 진료하나요?', path: '/support/hours', intent: '방문 준비', action: '지점별 진료시간과 예약 경로를 최신 운영 정보로 확인합니다.' },
];

export function plannedTopic(clinicId: ClinicId, index: number) {
  const question = clinicId === 'withyou-clinic' ? withyou.opportunities[index]?.question : goldmanQuestions[index]?.question;
  const hasDraft = clinicId === 'withyou-clinic' && index === 0;
  return {
    question: question ?? `추가 주제 선정 필요 #${index + 1}`,
    title: hasDraft ? withyou.contentDraft.h1 : (question?.replace(/\?$/, '') ?? `추가 주제 선정 필요 #${index + 1}`),
    status: hasDraft ? 'review_required' as const : question ? 'draft_required' as const : 'topic_pending' as const,
  };
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
