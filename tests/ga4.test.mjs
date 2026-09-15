import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

// All identities, OAuth credentials and reports here are synthetic. No external requests.
const root = new URL('../', import.meta.url), sql = new DatabaseSync(':memory:');
for (const name of readdirSync(new URL('drizzle/', root)).filter(name => name.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL(`drizzle/${name}`, root), 'utf8'));
globalThis.__ga4Env = { GOOGLE_GA4_CLIENT_ID: 'synthetic-client', GOOGLE_GA4_CLIENT_SECRET: 'synthetic-secret', GA4_TOKEN_ENCRYPTION_KEY: 'a1'.repeat(32) };
globalThis.__ga4Db = {
  prepare(query) {
    const statement = sql.prepare(query);
    const bound = values => ({ bind: (...next) => bound(next), first: async () => statement.get(...values) ?? null, all: async () => ({ results: statement.all(...values) }), run: async () => { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } }; } });
    return bound([]);
  },
  async batch(statements) { sql.exec('BEGIN'); try { const results = []; for (const statement of statements) results.push(await statement.run()); sql.exec('COMMIT'); return results; } catch(error) { sql.exec('ROLLBACK'); throw error; } },
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env=globalThis.__ga4Env', shortCircuit: true };
    if (specifier === '@/db') return { url: 'data:text/javascript,export function getDatabaseBinding(){return globalThis.__ga4Db}', shortCircuit: true };
    if (specifier.startsWith('@/')) { const base = specifier.slice(2), path = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(new URL(path, root))); if (path) return { url: new URL(path, root).href, shortCircuit: true }; }
    return next(specifier, context);
  },
  load(url, context, next) { if (url.startsWith(root.href) && /\.tsx?$/.test(url)) return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { fileName: new URL(url).pathname, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText }; return next(url, context); },
});
const g = await import('../lib/ga4.ts'), server = await import('../lib/ga4-server.ts');
const { GET: statusRoute } = await import('../app/api/ga4/status/route.ts');
const { GET: reportRoute } = await import('../app/api/ga4/report/route.ts');
const { POST: connectRoute } = await import('../app/api/ga4/connect/route.ts');
const { GET: callbackRoute } = await import('../app/api/ga4/callback/route.ts');
const { POST: disconnectRoute } = await import('../app/api/ga4/disconnect/route.ts');
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; });
const apiReport = (dimensions, metrics, rows) => ({ dimensionHeaders: dimensions.map(name => ({name})), metricHeaders: metrics.map(name => ({name})), rows: rows.map(values => ({ dimensionValues: values.slice(0, dimensions.length).map(value => ({ value: String(value) })), metricValues: values.slice(dimensions.length).map(value => ({ value: String(value) })) })), rowCount: rows.length, metadata: { timeZone: 'Asia/Seoul' } });
const reports = () => [apiReport([], ['sessions','activeUsers','keyEvents'], [[20, 7, 3]]), apiReport(['date'], ['sessions'], [['20260901',12],['20260902',8]]), apiReport(['sessionSource','sessionMedium'], ['sessions'], [['chatgpt.com','referral',4],['google','organic',16]]), apiReport(['date','landingPage'], ['sessions'], [['20260901','/docs/?email=secret@example.com',3],['20260902','/docs/',1]]), apiReport(['eventName'], ['eventCount'], [['cta_click',3],['page_view',25]])];
const dates = { startDate:'2026-09-01', endDate:'2026-09-02' };
function request(path, user = 'operator-a', method = 'GET', extra = {}) { return new Request(`${server.SITE_ORIGIN}${path}`, { method, headers: { ...(user ? { 'oai-authenticated-user-id': user } : {}), ...(method === 'POST' ? { origin: server.SITE_ORIGIN } : {}), ...extra } }); }
function validGoogle(url) {
  if (url.endsWith('/token')) return Response.json({ access_token:'synthetic-access', refresh_token:'synthetic-refresh', token_type:'Bearer', scope:g.GA4_SCOPE });
  if (url.endsWith(':runReport')) return Response.json(apiReport([], ['sessions'], [[1]]));
  if (url.endsWith(':checkCompatibility')) return Response.json({ dimensionCompatibilities: [{ compatibility:'INCOMPATIBLE', dimensionMetadata:{apiName:'unrelatedField'} }] });
  if (url.endsWith(':batchRunReports')) return Response.json({reports:reports()});
  throw new Error('Unexpected upstream request');
}
beforeEach(() => { sql.exec('DELETE FROM ga4_connections; DELETE FROM ga4_oauth_states;'); globalThis.__ga4Env.GOOGLE_GA4_CLIENT_ID = 'synthetic-client'; globalThis.fetch = async url => validGoogle(String(url)); });
async function attempt(user = 'operator-a') { const response = await server.beginOAuth(user); const state = new URL(response.headers.get('location')).searchParams.get('state'), cookie = response.headers.get('set-cookie').split(';')[0]; return request(`/api/ga4/callback?state=${state}&code=synthetic-code`, user, 'GET', {cookie}); }
async function connected() { await server.completeOAuth(await attempt(), 'operator-a'); }

test('API routes reject missing identity, foreign clinic/property, and cross-origin writes', async () => {
  for (const route of [statusRoute, reportRoute]) { assert.equal((await route(request('/api/ga4/status', ''))).status, 401); assert.equal((await route(request('/api/ga4/status?clinicId=withyou-clinic'))).status, 403); assert.equal((await route(request('/api/ga4/status?propertyId=other'))).status, 403); }
  for (const route of [connectRoute, disconnectRoute]) assert.equal((await route(request('/api/ga4/connect', 'operator-a', 'POST', {origin:'https://attacker.example'}))).status, 403);
});
test('missing configuration is explicit and cannot start OAuth; status never reveals secrets', async () => {
  delete globalThis.__ga4Env.GOOGLE_GA4_CLIENT_ID;
  const response = await statusRoute(request('/api/ga4/status')), body = await response.text();
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match(body, /"configured":false/); assert.doesNotMatch(body, /synthetic-secret|a1a1a1/);
  assert.equal((await connectRoute(request('/api/ga4/connect','operator-a','POST'))).status, 503);
});
test('OAuth requests minimal scope, offline consent, PKCE and secure session-bound cookie', async () => {
  const response = await server.beginOAuth('operator-a'), url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('scope'), g.GA4_SCOPE); assert.equal(url.searchParams.get('code_challenge_method'), 'S256'); assert.equal(url.searchParams.get('redirect_uri'), server.REDIRECT_URI);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.doesNotMatch(sql.prepare('SELECT encrypted_verifier FROM ga4_oauth_states').get().encrypted_verifier, /synthetic/);
});
test('successful OAuth probes fixed property, accepts compatibility metadata and encrypts refresh token', async () => {
  const urls = []; globalThis.fetch = async url => { urls.push(String(url)); return validGoogle(String(url)); };
  const req = await attempt(); await server.completeOAuth(req, 'operator-a');
  const row = sql.prepare('SELECT * FROM ga4_connections').get(); assert.equal(row.property_id, '421090862'); assert.equal(row.clinic_id, 'goldman-clinic'); assert.ok(row.encrypted_token.startsWith('v1.')); assert.doesNotMatch(row.encrypted_token, /synthetic-refresh/);
  assert.equal((await server.connectionStatus('operator-b')).connected, false);
  await assert.rejects(() => server.completeOAuth(req, 'operator-a'));
  assert.equal(urls.filter(url => url.endsWith(':checkCompatibility')).length, 5);
  assert.ok(urls.filter(url => url.includes('analyticsdata')).every(url => url.includes('properties/421090862:')));
  await assert.rejects(() => server.unseal(row.encrypted_token, 'wrong-user'));
});
test('wrong session, other user, expired or replayed state cannot exchange tokens', async () => {
  let calls = 0; globalThis.fetch = async url => { calls++; return validGoogle(String(url)); };
  const req = await attempt(); await assert.rejects(() => server.completeOAuth(req, 'operator-b'));
  const missingCookie = new Request(req.url, {headers:{'oai-authenticated-user-id':'operator-a'}}); await assert.rejects(() => server.completeOAuth(missingCookie, 'operator-a'));
  sql.prepare('UPDATE ga4_oauth_states SET expires_at = 0').run(); await assert.rejects(() => server.completeOAuth(req, 'operator-a')); assert.equal(calls,0);
});
test('disconnect during token exchange prevents late callback from resurrecting credentials', async () => {
  const req = await attempt(); let release, entered; const waiting = new Promise(resolve => { entered = resolve; });
  globalThis.fetch = async url => { if (String(url).endsWith('/token')) { entered(); await new Promise(resolve => { release = resolve; }); } return validGoogle(String(url)); };
  const completing = server.completeOAuth(req, 'operator-a'); await waiting; await server.disconnectGa4('operator-a'); release(); await assert.rejects(() => completing, /취소되었거나 변경/);
  assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM ga4_connections').get().count, 0);
});
test('older callback cannot consume or clear a newer attempt and cannot overwrite it', async () => {
  const old = await attempt(); const latest = await attempt(); const invalid = await callbackRoute(old); assert.equal(invalid.headers.get('set-cookie'), null); await server.completeOAuth(latest, 'operator-a'); assert.equal((await server.connectionStatus('operator-a')).connected, true);
});
test('refresh failure is reconnect-required, never zero, and does not expose upstream secrets', async () => {
  await connected(); globalThis.fetch = async () => Response.json({error:'invalid_grant', error_description:'secret upstream detail'}, {status:400});
  const response = await reportRoute(request('/api/ga4/report?days=28')); assert.equal(response.status, 401); assert.doesNotMatch(await response.text(), /secret upstream detail|synthetic/); assert.equal((await server.connectionStatus('operator-a')).needsReconnect, true);
});
test('successful authenticated report preserves refresh token when Google does not rotate it', async () => {
  await connected(); const before = sql.prepare('SELECT encrypted_token FROM ga4_connections').get().encrypted_token;
  globalThis.fetch = async url => String(url).endsWith('/token') ? Response.json({access_token:'synthetic-access', token_type:'Bearer', scope:g.GA4_SCOPE}) : validGoogle(String(url));
  const response = await reportRoute(request('/api/ga4/report?startDate=2026-09-01&endDate=2026-09-02'));
  assert.equal(response.status,200); const body = await response.json(); assert.equal(body.report.ai.sessions,4); assert.equal(body.report.totals.activeUsers,7);
  assert.equal(sql.prepare('SELECT encrypted_token FROM ga4_connections').get().encrypted_token,before); assert.ok((await server.connectionStatus('operator-a')).lastFetchedAt);
  assert.doesNotMatch(JSON.stringify(body), /synthetic-access|synthetic-refresh|secret@example/);
  assert.equal((await reportRoute(request('/api/ga4/report','operator-b'))).status,409);
});
test('scope refusal cannot persist credentials, and cancellation does not call upstream', async () => {
  let calls=0; globalThis.fetch = async () => { calls++; return Response.json({access_token:'synthetic-access', refresh_token:'synthetic-refresh', token_type:'Bearer', scope:'unrelated'}); };
  await assert.rejects(() => attempt().then(req => server.completeOAuth(req,'operator-a')), /읽기 권한/);
  assert.equal((await server.connectionStatus('operator-a')).connected,false);
  const req = await attempt(), url = new URL(req.url); url.searchParams.delete('code'); url.searchParams.set('error','access_denied'); const before = calls;
  const response = await server.completeOAuth(new Request(url, {headers:req.headers}),'operator-a'); assert.match(response.headers.get('location'), /ga4=cancelled/); assert.equal(calls,before);
});
test('a delayed report is not returned after disconnect and rotated token cannot recreate connection', async () => {
  await connected(); let release, entered; const waiting = new Promise(resolve => { entered = resolve; });
  globalThis.fetch = async url => { if (String(url).endsWith(':batchRunReports')) { entered(); await new Promise(resolve => { release=resolve; }); } return validGoogle(String(url)); };
  const result = server.fetchGa4Report('operator-a', new URLSearchParams(dates)); await waiting; await server.disconnectGa4('operator-a'); release(); await assert.rejects(() => result, /연결 상태가 바뀌/); assert.equal((await server.connectionStatus('operator-a')).connected, false);
});
test('period totals are direct totals; AI domain matching excludes ads, spoof hosts and ordinary Google', () => {
  const result = g.summarizeGa4(reports(), dates, 'Asia/Seoul'); assert.equal(result.totals.activeUsers, 7); assert.equal(result.totals.keyEvents, 3); assert.equal(result.ai.sessions,4); assert.equal(result.daily.reduce((sum,row)=>sum+row.aiSessions,0),4); assert.equal(result.ai.pages[0].path,'/docs/'); assert.doesNotMatch(JSON.stringify(result), /secret@example/);
  for (const host of g.AI_REFERRAL_SOURCES) assert.ok(g.aiReferral(host,'referral'));
  assert.equal(g.aiReferral('chatgpt.com.evil.example','referral'),null); assert.equal(g.aiReferral('google','organic'),null); assert.equal(g.aiReferral('chatgpt.com','cpc'),null);
});
test('date ranges use property timezone, exclude today, and reject invalid/partial/oversized ranges', () => {
  const now = new Date('2026-09-16T02:00:00Z'); assert.deepEqual(g.reportDates(new URLSearchParams('days=7'), 'America/Los_Angeles', now), {startDate:'2026-09-08',endDate:'2026-09-14'});
  for (const query of ['days=0','startDate=2026-02-30&endDate=2026-03-01','startDate=2026-09-01','startDate=2026-01-01&endDate=2026-09-16','startDate=2020-01-01&endDate=2026-09-01']) assert.throws(()=>g.reportDates(new URLSearchParams(query),'Asia/Seoul',now));
});
test('partial rows and malformed reports never masquerade as complete results; threshold warnings persist', () => {
  const partial = reports(); partial[2].rowCount = 10001; assert.throws(()=>g.summarizeGa4(partial,dates,'Asia/Seoul'), /일부 행/);
  assert.throws(()=>g.summarizeGa4([{}, {}, {}, {}, {}], dates,'Asia/Seoul'), /구조/);
  const limited = reports(); limited[0].metadata.subjectToThresholding = true; assert.equal(g.summarizeGa4(limited,dates,'Asia/Seoul').warnings.length,1);
});
