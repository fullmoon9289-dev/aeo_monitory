import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Pure render checks with synthetic data; no browser, network or production DB.
const root = new URL('../', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      const base = specifier.slice(2);
      const file = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(new URL(path, root)));
      if (file) return { url: new URL(file, root).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
    if (url.startsWith(root.href) && /\.tsx?$/.test(url)) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { fileName: new URL(url).pathname, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText,
    };
    return next(url, context);
  },
});
const { GoldmanDashboard } = await import('../components/goldman-dashboard.tsx');
const { GoldmanPerformance } = await import('../components/goldman-performance.tsx');
const { Ga4Connection } = await import('../components/ga4-connection.tsx');
const { GoldmanReport } = await import('../components/goldman-report.tsx');
const { workflowNavigation } = await import('../lib/workspace-navigation.ts');
const report = { clinicId: 'goldman-clinic', dimension: 'query', startDate: '2026-08-01', endDate: '2026-08-31', rows: [{ label: '합성 검색어', clicks: 12, impressions: 300, ctr: 4, position: 8 }] };
const noop = () => {};
const props = { report, loading: false, error: '', onNavigate: noop };

test('Goldman renders actual imported rows but does not invent AI measurements', () => {
  const html = renderToStaticMarkup(createElement(GoldmanPerformance, props));
  assert.match(html, /2026-08-01 ~ 2026-08-31/);
  assert.match(html, /4\.00%/);
  assert.match(html, /합성 검색어/);
  assert.match(html, /AI 측정 기간 없음/);
  assert.match(html, /실제 답변 원문이 없는 기간에는 그래프를 그리지 않습니다/);
  assert.doesNotMatch(html, /37\.2%|23\.6%|18\.2%/);
});

test('question fetch failure is visible even when an old sourced question set remains', () => {
  const html = renderToStaticMarkup(createElement(GoldmanDashboard, { ...props, items: [], questionSet: { source: { id: 'synthetic-old-report' } }, questionLoading: false, questionError: '합성 조회 실패', questionDescription: '자료 확인 필요', onBrief: noop }));
  assert.match(html, /질문 자료 확인 필요: 합성 조회 실패/);
  assert.match(html, /최신 자료로 확인되지 않았습니다/);
  assert.match(html, /3 \/ 7 완료/);
  assert.doesNotMatch(html, /4 \/ 7 완료/);
});

test('loading and failed search imports do not leak previous metric values', () => {
  for (const state of [{ loading: true, error: '' }, { loading: false, error: '합성 오류' }]) {
    const html = renderToStaticMarkup(createElement(GoldmanPerformance, { ...props, ...state }));
    assert.doesNotMatch(html, /합성 검색어|4\.00%/);
  }
});
test('GA4 setup state explains prerequisites without displaying a false connected button', () => {
  const html = renderToStaticMarkup(createElement(Ga4Connection, {data:{status:{configured:false, connected:false, propertyId:'421090862', missing:['GOOGLE_GA4_CLIENT_ID']}, report:null, error:'', loading:false, reload:noop}}));
  assert.match(html,/Google 서버 설정 대기/); assert.match(html,/421090862/); assert.match(html,/api\/ga4\/callback/); assert.doesNotMatch(html,/<form/);
});
test('GA4 actual referral zero is displayed as measured, while errors hide the stale result', () => {
  const ga4 = { loading:false, error:'', status:{connected:true}, reload:noop, setRange:noop, report:{propertyId:'421090862', startDate:'2026-08-01', endDate:'2026-08-31', timezone:'Asia/Seoul', fetchedAt:'2026-09-01T00:00:00Z', totals:{sessions:12345, activeUsers:500, keyEvents:25}, daily:[], sources:[], events:[], ai:{sessions:0,sources:[],pages:[]}, warnings:[]} };
  const html = renderToStaticMarkup(createElement(GoldmanPerformance, {...props,ga4})); assert.match(html,/GA4 실측/); assert.match(html,/12,345/); assert.match(html,/AI 측정 기간 없음/); assert.match(html,/주요 이벤트/);
  const failed = renderToStaticMarkup(createElement(GoldmanPerformance,{...props,ga4:{...ga4,error:'합성 GA4 오류'}})); assert.doesNotMatch(failed,/12,345|GA4 실측/); assert.match(failed,/합성 GA4 오류/);
});

test('Goldman report renders five sheets with auditable sources and limited data scope', () => {
  const html = renderToStaticMarkup(createElement(GoldmanReport, { ...props, onBack: noop }));
  assert.equal((html.match(/class="report-sheet /g) || []).length, 5);
  assert.match(html, /사용자 제공 CSV에 포함된 행의 합계/);
  assert.match(html, /https:\/\/www\.gold-man\.com\/docs\/prostate\/bph-surgery-cost\.html/);
  assert.match(html, /메디앤서의 작업 때문에 발생했다고 단정하지 않습니다/);
});

test('both clinic workspaces use the same workflow navigation sequence', () => {
  assert.deepEqual(workflowNavigation(8).map(item => item.id), ['command', 'performance', 'journey', 'opportunities', 'studio', 'monitor', 'report', 'search-console']);
});
