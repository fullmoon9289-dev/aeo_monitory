import type { SearchImport, SearchRow } from './search-console';

export type Opportunity = {
  priority: number;
  question: string;
  stage: string;
  reason: string;
  evidence: string;
  risk: string;
  demand: string;
  keyword?: string;
  clicks?: number;
  impressions?: number;
  position?: number;
};

export type QuestionSet = {
  items: Opportunity[];
  source: Omit<SearchImport, 'rows'> | null;
  version: string | null;
  evaluatedAt: string;
  refreshDue: boolean;
  reportDays: number | null;
  excludedRows: number;
  candidateCount: number;
};

const day = 86_400_000;
const relevance = {
  'withyou-clinic': /아토피|알레르기|두드러기|피부염|습진|소양|가려움|가려운|접촉성|지루성|건선|한포진|모낭염|여드름|안면\s*홍조|피부\s*검사|면역\s*검사|알러지|atop|allerg|eczema|urticaria/i,
  'goldman-clinic': /전립선|비뇨|요로|결석|혈뇨|배뇨|빈뇨|야간뇨|방광|요도|포경|정관|콘딜로마|곤지름|성병|발기|조루|고환|남성\s*불임|음경|음낭|매독|임질|클라미디아|정액|전립샘|소변|사정|prostate|urolog/i,
};
const brands = /위드유|with\s*you|withyou|골드만|gold[\s-]*man/i;

export function stageForQuery(query: string): string {
  if (/병원|의원|예약|진료시간|위치|추천|전문의|어디|강남|도곡/.test(query)) return '병원 선택';
  if (/검사|진단|수치|양성|음성|igg|ige|mast/i.test(query)) return '검사 이해';
  if (/치료|수술|약|비용|가격|회복|관리|부작용|완치|재발|한방|양방/.test(query)) return '치료 비교';
  if (/차이|구분|종류|전염|원인|뜻/.test(query)) return '질환 확인';
  return '증상 탐색';
}

export function questionForQuery(query: string): string {
  if (/[?？]$|나요$|까요$|인가요$/.test(query)) return query.replace(/[?？]?$/, '?');
  if (/비용|가격/.test(query)) return `${query}, 비용은 어떤 기준으로 달라지나요?`;
  if (/회복|수술\s*후/.test(query)) return `${query}, 일상 복귀 전에 무엇을 확인해야 하나요?`;
  if (/검사|진단|igg|ige|mast/i.test(query)) return `${query}, 언제 필요하고 결과를 어떻게 해석하나요?`;
  if (/차이|구분|종류/.test(query)) return `${query}, 어떻게 구분하고 확인하나요?`;
  if (/치료|수술|약|한방|양방/.test(query)) return `${query}, 선택 전에 무엇을 확인해야 하나요?`;
  return `${query}, 진료 전에 무엇을 알아야 하나요?`;
}

// Internal editorial ranking only: it is not a market-search-volume or AI score.
export function opportunityScore(row: SearchRow): number {
  const ctr = row.impressions ? row.clicks / row.impressions : 0;
  return Math.log1p(row.impressions) * 10
    + (row.position >= 4 && row.position <= 20 ? 15 : 0)
    + (row.impressions >= 100 && ctr < .03 ? 10 : 0);
}

export function buildQuestionSet(
  clinicId: 'withyou-clinic' | 'goldman-clinic',
  report: SearchImport | null,
  now = new Date(),
): QuestionSet {
  const empty: QuestionSet = { items: [], source: null, version: null, evaluatedAt: now.toISOString(), refreshDue: true, reportDays: null, excludedRows: 0, candidateCount: 0 };
  if (!report || report.clinicId !== clinicId || report.dimension !== 'query') return empty;
  const { rows, ...source } = report;
  const normalized = new Map<string, SearchRow>();
  for (const row of rows) {
    const label = row.label.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (label.length < 2 || label.length > 120 || row.impressions < 10 || brands.test(label) || !relevance[clinicId].test(label)) continue;
    // Exclude contact identifiers and links from editorial candidates.
    if (/https?:|@|\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|[\r\n]/.test(row.label)) continue;
    const key = label.toLowerCase().replace(/[\s?？]/g, '');
    const existing = normalized.get(key);
    // Similar spellings are one candidate, but metrics remain one exact source row.
    if (!existing || row.impressions > existing.impressions || (row.impressions === existing.impressions && label.localeCompare(existing.label, 'ko') < 0)) normalized.set(key, { ...row, label });
  }
  const candidates = [...normalized.values()].sort((a, b) => opportunityScore(b) - opportunityScore(a) || b.impressions - a.impressions || a.label.localeCompare(b.label, 'ko'));
  const items = candidates.slice(0, 30).map((row, index): Opportunity => {
    const ctr = row.clicks / row.impressions * 100;
    const reasons = [`검색어 ‘${row.label}’ · 노출 ${row.impressions.toLocaleString('ko-KR')}회 · 클릭 ${row.clicks.toLocaleString('ko-KR')}회 · 클릭률 ${ctr.toFixed(1)}% · 평균 순위 ${row.position.toFixed(1)}`];
    if (row.impressions >= 100 && ctr < 3) reasons.push('노출 대비 클릭이 적어 제목과 첫 답변 검토 후보입니다.');
    else if (row.position >= 4 && row.position <= 20) reasons.push('평균 순위 4~20위 구간으로 기존 콘텐츠 보강 후보입니다.');
    else reasons.push('실제 검색어와 진료 범위를 연결한 콘텐츠 검토 후보입니다.');
    return { priority: index + 1, question: questionForQuery(row.label), stage: stageForQuery(row.label), reason: reasons.join(' '), evidence: '검색어 CSV', risk: '의료진 검수', demand: `보고서 기간 노출 ${row.impressions}회`, keyword: row.label, clicks: row.clicks, impressions: row.impressions, position: row.position };
  });
  const today = new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
  return {
    items, source, version: `${report.id}:questions-v1`, evaluatedAt: now.toISOString(),
    refreshDue: Date.parse(today) - Date.parse(report.endDate) >= 7 * day,
    reportDays: Math.round((Date.parse(report.endDate) - Date.parse(report.startDate)) / day) + 1,
    excludedRows: rows.length - candidates.length, candidateCount: candidates.length,
  };
}

export function questionSetDescription(set: QuestionSet | null, loading: boolean, error: string) {
  if (error) return `질문 자료를 불러오지 못했습니다. ${error}`;
  if (loading && !set) return '저장된 검색어와 질문 갱신 상태를 확인하고 있습니다.';
  if (!set?.source) return '홈페이지 기반 초기 제안입니다. 서치콘솔 분석에서 최근 28일 검색어 CSV를 저장하면 질문과 우선순위가 자동 갱신됩니다. 매주 새 자료를 가져와 주세요.';
  const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }).format(new Date(set.source.createdAt));
  return `검색 기간 ${set.source.startDate} ~ ${set.source.endDate} (${set.reportDays}일) · 자료 반영 ${date} · ${set.items.length}개 기획 제안. ${set.refreshDue ? '자료 종료일이 7일 이상 지나 새 검색어 자료가 필요합니다.' : '다음 주에도 새 검색어 자료를 저장하면 자동 갱신됩니다.'}${(set.reportDays ?? 0) > 35 ? ' 장기 집계 자료로, 최근 28일 자료를 권장합니다.' : ''} Google 자동 수집은 아직 연결되지 않았습니다.`;
}
