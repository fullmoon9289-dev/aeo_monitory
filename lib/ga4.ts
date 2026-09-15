// Browser-safe report contract. Credentials and OAuth logic live in ga4-server.ts.
export const GA4_PROPERTY_ID = '421090862';
export const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export type Ga4Status = { configured: boolean; connected: boolean; propertyId: string; missing: string[]; timezone?: string; connectedAt?: string; lastFetchedAt?: string | null; redirectUri: string; needsReconnect?: boolean };
export type Ga4Report = {
  propertyId: string; startDate: string; endDate: string; timezone: string; fetchedAt: string;
  totals: { sessions: number; activeUsers: number; keyEvents: number };
  daily: { date: string; sessions: number; aiSessions: number }[];
  sources: { source: string; medium: string; sessions: number; ai: string | null }[];
  events: { name: string; count: number }[];
  ai: { sessions: number; sources: { name: string; sessions: number }[]; pages: { path: string; sessions: number }[] };
  warnings: string[];
};
const aiHosts: [string, string[]][] = [
  ['ChatGPT', ['chatgpt.com', 'chat.openai.com']], ['Perplexity', ['perplexity.ai']],
  ['Gemini', ['gemini.google.com']], ['Claude', ['claude.ai']], ['Copilot', ['copilot.microsoft.com']],
];
export const AI_REFERRAL_SOURCES = aiHosts.flatMap(([, hosts]) => hosts.flatMap(host => [host, `www.${host}`]));
// Only a known host reported as referral is counted. UTM/campaign names are not proof.
export function aiReferral(source: string, medium: string): string | null {
  if (medium.toLowerCase() !== 'referral') return null;
  const host = source.toLowerCase().replace(/^www\./, '');
  return aiHosts.find(([, hosts]) => hosts.includes(host))?.[0] ?? null;
}
export function dateInZone(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function shiftDate(date: string, days: number) { return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }
export function reportDates(params: URLSearchParams, timezone: string, now = new Date()) {
  const yesterday = shiftDate(dateInZone(timezone, now), -1);
  let startDate = params.get('startDate'), endDate = params.get('endDate');
  if (!startDate && !endDate) {
    const days = Number(params.get('days') || 28);
    if (![7, 28, 90].includes(days)) throw new Error('조회 기간은 7일·28일·90일 중 선택해 주세요.');
    startDate = shiftDate(yesterday, 1 - days); endDate = yesterday;
  }
  const valid = (date: string | null): date is string => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) && shiftDate(date, 0) === date;
  if (!valid(startDate) || !valid(endDate) || startDate > endDate || endDate > yesterday || startDate < '2015-01-01' || Date.parse(endDate) - Date.parse(startDate) > 365 * 86400000) throw new Error('어제까지의 날짜로, 최대 366일 범위를 선택해 주세요.');
  return { startDate, endDate };
}

export type ApiReport = { dimensionHeaders?: { name: string }[]; metricHeaders?: { name: string }[]; rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[]; rowCount?: number; metadata?: { timeZone?: string; subjectToThresholding?: boolean; dataLossFromOtherRow?: boolean; samplingMetadatas?: unknown[] } };
export function apiRows(report: ApiReport): Record<string, string>[] {
  return (report.rows || []).map(row => Object.fromEntries([
    ...(report.dimensionHeaders || []).map((header, index) => [header.name, row.dimensionValues?.[index]?.value || '']),
    ...(report.metricHeaders || []).map((header, index) => [header.name, row.metricValues?.[index]?.value || '0']),
  ]));
}
export function safePagePath(value: string): string {
  // No query strings, fragments, form values or identifier-like path segments leave the server.
  if (!value.startsWith('/') || value.startsWith('//')) return '(페이지 경로 비공개)';
  const path = value.split(/[?#]/)[0].slice(0, 180);
  return path.split('/').map(part => /@|%40|\d{6,}|%[a-f\d]{2}.*%[a-f\d]{2}/i.test(part) ? '[비공개]' : part).join('/');
}
export function summarizeGa4(reports: ApiReport[], dates: { startDate: string; endDate: string }, timezone: string): Ga4Report {
  if (reports.length !== 5) throw new Error('GA4 보고서 응답이 불완전합니다.');
  const shapes = [[[], ['sessions', 'activeUsers', 'keyEvents']], [['date'], ['sessions']], [['sessionSource', 'sessionMedium'], ['sessions']], [['date', 'landingPage'], ['sessions']], [['eventName'], ['eventCount']]];
  for (const [index, report] of reports.entries()) {
    const [dimensions, metrics] = shapes[index];
    if (dimensions.some(name => !report.dimensionHeaders?.some(header => header.name === name)) || metrics.some(name => !report.metricHeaders?.some(header => header.name === name)) || report.rows?.some(row => row.dimensionValues?.length !== dimensions.length && dimensions.length > 0 || row.metricValues?.length !== metrics.length)) throw new Error('GA4 보고서 구조를 확인할 수 없습니다.');
  }
  const n = (value?: string) => { const num = Number(value || 0); if (!Number.isFinite(num) || num < 0) throw new Error('GA4 수치 형식을 확인할 수 없습니다.'); return num; };
  const total = apiRows(reports[0])[0] || {};
  const sources = apiRows(reports[2]).map(row => ({ source: row.sessionSource, medium: row.sessionMedium, sessions: n(row.sessions), ai: aiReferral(row.sessionSource, row.sessionMedium) })).sort((a,b) => b.sessions - a.sessions);
  const aiBySource = new Map<string, number>(), aiByDate = new Map<string, number>(), aiPages = new Map<string, number>();
  for (const row of sources) if (row.ai) aiBySource.set(row.ai, (aiBySource.get(row.ai) || 0) + row.sessions);
  for (const row of apiRows(reports[3])) {
    const value = n(row.sessions);
    aiByDate.set(row.date, (aiByDate.get(row.date) || 0) + value);
    const path = safePagePath(row.landingPage);
    aiPages.set(path, (aiPages.get(path) || 0) + value);
  }
  const warnings = new Set<string>();
  for (const report of reports) {
    if (!report.metricHeaders?.length || (report.rowCount || 0) < 0) throw new Error('GA4 보고서 구조를 확인할 수 없습니다.');
    if (report.metadata?.timeZone && report.metadata.timeZone !== timezone) throw new Error('GA4 속성 시간대가 변경됐습니다. 연결을 갱신한 후 다시 조회해 주세요.');
    if ((report.rowCount || 0) > (report.rows || []).length) throw new Error('일부 행만 수집되어 성과 합계를 표시하지 않았습니다. 기간을 줄여 다시 조회해 주세요.');
    if (report.metadata?.subjectToThresholding) warnings.add('Google 개인정보 보호 기준이 적용될 수 있어 일부 소규모 데이터가 숨겨질 수 있습니다.');
    if (report.metadata?.dataLossFromOtherRow) warnings.add('Google의 (other) 집계로 일부 세부 출처가 구분되지 않습니다.');
    if (report.metadata?.samplingMetadatas?.length) warnings.add('Google이 표본 추출한 보고서입니다.');
  }
  const dailyMap = new Map(apiRows(reports[1]).map(row => [row.date, n(row.sessions)]));
  const daily: Ga4Report['daily'] = [];
  for (let date = dates.startDate; date <= dates.endDate; date = shiftDate(date, 1)) { const key = date.replaceAll('-', ''); daily.push({ date, sessions: dailyMap.get(key) || 0, aiSessions: aiByDate.get(key) || 0 }); }
  const safeLabel = (value: string) => /^[a-zA-Z0-9._() /-]{1,80}$/.test(value) && !/\d{6,}/.test(value) ? value : '(항목 비공개)';
  return { propertyId: GA4_PROPERTY_ID, ...dates, timezone, fetchedAt: new Date().toISOString(), totals: { sessions: n(total.sessions), activeUsers: n(total.activeUsers), keyEvents: n(total.keyEvents) }, daily, sources: sources.slice(0, 20).map(source => ({ ...source, source: safeLabel(source.source), medium: safeLabel(source.medium) })), events: apiRows(reports[4]).map(row => ({ name: /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(row.eventName) && !/\d{6,}/.test(row.eventName) ? row.eventName : '(이벤트 이름 비공개)', count: n(row.eventCount) })).sort((a,b) => b.count - a.count).slice(0, 20), ai: { sessions: [...aiBySource.values()].reduce((sum, value) => sum + value, 0), sources: [...aiBySource].map(([name, sessions]) => ({ name, sessions })), pages: [...aiPages].map(([path, sessions]) => ({ path, sessions })).sort((a,b) => b.sessions - a.sessions).slice(0, 5) }, warnings: [...warnings] };
}
