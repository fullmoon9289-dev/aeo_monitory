import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionSet, questionForQuery } from '../lib/question-opportunities.ts';

const now = new Date('2026-09-15T14:00:00Z');
const row = (label, impressions = 200, clicks = 2, position = 8) => ({ label, impressions, clicks, position });
const report = (rows, overrides = {}) => ({ id: 'test-only-report', clinicId: 'withyou-clinic', propertyUrl: 'https://withyouclinic.com/', dimension: 'query', startDate: '2026-08-16', endDate: '2026-09-12', filename: 'synthetic.csv', createdAt: '2026-09-15T00:00:00Z', rows, ...overrides });

test('new query reports change both questions and priority; count is not fixed at five', () => {
  const first = buildQuestionSet('withyou-clinic', report([row('아토피 검사'), row('두드러기 원인', 400)]), now);
  assert.match(first.items[0].question, /두드러기/);
  const next = buildQuestionSet('withyou-clinic', report(['아토피 검사','아토피 치료','두드러기 원인','알레르기 검사','접촉성 피부염','습진 관리','피부염 종류'].map(q => row(q)), { id: 'new' }), now);
  assert.equal(next.items.length, 7);
  assert.notEqual(first.version, next.version);
  assert.deepEqual(next.items.map(x => x.priority), [1,2,3,4,5,6,7]);
});

test('filters unrelated, brand, identifiers and low-signal terms without mixing clinics', () => {
  const r = report([row('위드유 아토피'), row('전립선 수술'), row('아토피 010-1234-5678'), row('날씨'), row('습진', 9), row('알레르기 검사')]);
  const set = buildQuestionSet('withyou-clinic', r, now);
  assert.equal(set.items.length, 1);
  assert.equal(set.items[0].keyword, '알레르기 검사');
  assert.equal(buildQuestionSet('goldman-clinic', r, now).source, null);
  assert.equal(buildQuestionSet('withyou-clinic', report([row('아토피')], { dimension: 'page' }), now).source, null);
});

test('freshness uses report end date, not upload date; no invented 28-day slicing', () => {
  const set = buildQuestionSet('withyou-clinic', report([row('아토피')], { startDate:'2026-06-01', endDate:'2026-08-31' }), now);
  assert.equal(set.refreshDue, true);
  assert.equal(set.reportDays, 92);
  assert.equal(set.source.endDate, '2026-08-31');
  assert.equal(buildQuestionSet('withyou-clinic', report([]), now).refreshDue, false);
});

test('similar spellings retain one observed row instead of adding duplicated impressions', () => {
  const set = buildQuestionSet('withyou-clinic', report([row('아토피 검사', 200), row('아토피검사', 400)]), now);
  assert.equal(set.items.length, 1);
  assert.equal(set.items[0].impressions, 400);
});

test('no candidates is an explicit empty result; unchanged reports preserve the measurement version', () => {
  const r = report([row('골드만')]);
  const a = buildQuestionSet('withyou-clinic', r, now);
  const b = buildQuestionSet('withyou-clinic', r, new Date('2026-09-16T01:00:00Z'));
  assert.ok(a.source);
  assert.equal(a.items.length, 0);
  assert.equal(a.version, b.version);
  assert.notEqual(a.evaluatedAt, b.evaluatedAt);
});

test('natural questions stay questions and procedure/cost keywords produce editorial prompts', () => {
  assert.equal(questionForQuery('두드러기는 언제 병원에 가야 하나요?'), '두드러기는 언제 병원에 가야 하나요?');
  const set = buildQuestionSet('goldman-clinic', report([row('포경수술 비용'), row('전립선 수술 후 회복')], { clinicId:'goldman-clinic', propertyUrl:'https://www.gold-man.com/' }), now);
  assert.equal(set.items.length, 2);
  assert.ok(set.items.every(item => item.evidence === '검색어 CSV' && !('growthRate' in item)));
});
