import { env } from 'cloudflare:workers';
import { getDatabaseBinding } from '@/db';
import { AI_REFERRAL_SOURCES, GA4_PROPERTY_ID, GA4_SCOPE, reportDates, summarizeGa4, type ApiReport } from '@/lib/ga4';

export const SITE_ORIGIN = 'https://mediaanswer-aeo.fullmoon9289.chatgpt.site';
export const REDIRECT_URI = `${SITE_ORIGIN}/api/ga4/callback`;
const CLINIC = 'goldman-clinic', COOKIE = '__Host-medianswer-ga4';
const encoder = new TextEncoder();
type Connection = { user_id: string; id: string; clinic_id: string; property_id: string; encrypted_token: string; timezone: string; connected_at: string; last_fetched_at: string | null; needs_reconnect: number };
class Ga4Error extends Error { constructor(message: string, readonly status = 400) { super(message); } }
export function privateJson(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } }); }
export function ga4Error(error: unknown) { return privateJson({ error: error instanceof Ga4Error ? error.message : 'GA4 자료를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, error instanceof Ga4Error ? error.status : 503); }
export function requireGa4User(request: Request, mutation = false) {
  // The Sites dispatcher supplies identity; production access policy remains owner-only.
  const user = request.headers.get('oai-authenticated-user-id');
  if (!user || user.length > 256) throw new Ga4Error('메디앤서에 로그인한 뒤 다시 시도해 주세요.', 401);
  const url = new URL(request.url);
  if (url.searchParams.has('clinicId') && url.searchParams.get('clinicId') !== CLINIC) throw new Ga4Error('골드만 전용 연결입니다.', 403);
  if (url.searchParams.has('propertyId') && url.searchParams.get('propertyId') !== GA4_PROPERTY_ID) throw new Ga4Error('허용되지 않은 GA4 속성입니다.', 403);
  if (mutation && request.headers.get('origin') !== SITE_ORIGIN) throw new Ga4Error('메디앤서 화면에서 다시 요청해 주세요.', 403);
  return user;
}
function config() {
  const values = { GOOGLE_GA4_CLIENT_ID: env.GOOGLE_GA4_CLIENT_ID, GOOGLE_GA4_CLIENT_SECRET: env.GOOGLE_GA4_CLIENT_SECRET, GA4_TOKEN_ENCRYPTION_KEY: env.GA4_TOKEN_ENCRYPTION_KEY };
  const missing = Object.entries(values).filter(([, value]) => !value?.trim()).map(([key]) => key);
  if (values.GA4_TOKEN_ENCRYPTION_KEY && !/^[a-f\d]{64}$/i.test(values.GA4_TOKEN_ENCRYPTION_KEY)) missing.push('GA4_TOKEN_ENCRYPTION_KEY');
  return { ...values, missing };
}
function requireConfig() { const value = config(); if (value.missing.length) throw new Ga4Error('Google 연결용 서버 설정이 필요합니다. 연동 및 설정의 준비 안내를 확인해 주세요.', 503); return value; }
function b64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function unb64(value: string) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0)); }
export function randomSecret() { return b64(crypto.getRandomValues(new Uint8Array(32))); }
export async function hash(value: string) { return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
async function encryptionKey() { const key = requireConfig().GA4_TOKEN_ENCRYPTION_KEY!; return crypto.subtle.importKey('raw', Uint8Array.from(key.match(/../g)!, byte => parseInt(byte, 16)), 'AES-GCM', false, ['encrypt', 'decrypt']); }
export async function seal(value: string, context: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) }, await encryptionKey(), encoder.encode(value));
  return `v1.${b64(iv)}.${b64(new Uint8Array(ciphertext))}`;
}
export async function unseal(value: string, context: string) {
  const [version, iv, ciphertext] = value.split('.');
  if (version !== 'v1' || !iv || !ciphertext) throw new Ga4Error('저장된 연결을 읽을 수 없습니다. 다시 연결해 주세요.', 409);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: encoder.encode(context) }, await encryptionKey(), unb64(ciphertext)));
}
function tokenContext(user: string, id: string) { return `${user}|${CLINIC}|${GA4_PROPERTY_ID}|${id}`; }
async function connection(user: string) { return getDatabaseBinding().prepare('SELECT * FROM ga4_connections WHERE user_id = ? AND clinic_id = ? AND property_id = ?').bind(user, CLINIC, GA4_PROPERTY_ID).first<Connection>(); }
export async function connectionStatus(user: string) {
  const c = config(); const row = await connection(user);
  return { configured: !c.missing.length, connected: !!row && !row.needs_reconnect && !c.missing.length, needsReconnect: !!row?.needs_reconnect, propertyId: GA4_PROPERTY_ID, missing: c.missing, redirectUri: REDIRECT_URI, timezone: row?.timezone, connectedAt: row?.connected_at, lastFetchedAt: row?.last_fetched_at };
}
async function googleJson(url: string, init: RequestInit) {
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000), redirect: 'error' }); } catch { throw new Ga4Error('Google 응답이 지연되고 있습니다. 잠시 후 다시 조회해 주세요.', 504); }
  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    // Never return Google's raw error, token or request body to the client/log.
    if (json.error === 'invalid_grant') throw new Ga4Error('Google 읽기 권한이 만료·취소되었습니다. 다시 연결해 주세요.', 401);
    if (response.status === 403) throw new Ga4Error('GA4 속성의 읽기 권한과 Google Analytics Data API 사용 설정을 확인해 주세요.', 403);
    if (response.status === 429) throw new Ga4Error('Google 조회 한도에 도달했습니다. 잠시 후 다시 조회해 주세요.', 429);
    throw new Ga4Error('Google 연결 또는 보고서 요청이 거절되었습니다. 인증 설정과 읽기 권한을 확인해 주세요.', 502);
  }
  return json;
}
async function exchange(params: Record<string, string>) {
  const c = requireConfig();
  const data = await googleJson('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: c.GOOGLE_GA4_CLIENT_ID!, client_secret: c.GOOGLE_GA4_CLIENT_SECRET!, ...params }) });
  if (typeof data.access_token !== 'string' || data.token_type !== 'Bearer') throw new Ga4Error('Google 인증 응답을 확인할 수 없습니다.', 502);
  return data as { access_token: string; refresh_token?: string; scope?: string; token_type: string };
}
async function dataApi(token: string, method: string, body: object) { return googleJson(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:${method}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
const cookie = (value: string, maxAge: number) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export async function beginOAuth(user: string) {
  const c = requireConfig(), db = getDatabaseBinding();
  const state = randomSecret(), binding = randomSecret(), verifier = randomSecret();
  const stateHash = await hash(state);
  await db.batch([
    db.prepare('DELETE FROM ga4_oauth_states WHERE user_id = ? OR expires_at < ?').bind(user, Date.now()),
    db.prepare('INSERT INTO ga4_oauth_states (state_hash, user_id, binding_hash, encrypted_verifier, expires_at) VALUES (?, ?, ?, ?, ?)').bind(stateHash, user, await hash(binding), await seal(verifier, `${user}|oauth|${stateHash}`), Date.now() + 600000),
  ]);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: c.GOOGLE_GA4_CLIENT_ID!, redirect_uri: REDIRECT_URI, response_type: 'code', scope: GA4_SCOPE, access_type: 'offline', prompt: 'consent', state, code_challenge: await hash(verifier), code_challenge_method: 'S256' }).toString();
  return new Response(null, { status: 303, headers: { Location: url.toString(), 'Set-Cookie': cookie(binding, 600), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
// Let the short-lived cookie expire. A delayed callback must not clear a newer attempt's cookie.
export function callbackRedirect(result: string) { return new Response(null, { status: 303, headers: { Location: `${SITE_ORIGIN}/?clinic=${CLINIC}&view=settings&ga4=${result}`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }); }
export async function completeOAuth(request: Request, user: string) {
  requireConfig();
  const params = new URL(request.url).searchParams, state = params.get('state') || '';
  const binding = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
  if (!/^[\w-]{43}$/.test(state) || !/^[\w-]{43}$/.test(binding)) throw new Ga4Error('연결 요청이 만료되었거나 일치하지 않습니다.', 400);
  const stateHash = await hash(state), db = getDatabaseBinding();
  // Claim atomically, but retain the attempt so disconnect/new connect can cancel in-flight work.
  const pending = await db.prepare("UPDATE ga4_oauth_states SET binding_hash = 'claimed' WHERE state_hash = ? AND user_id = ? AND binding_hash = ? AND expires_at > ? RETURNING encrypted_verifier").bind(stateHash, user, await hash(binding), Date.now()).first<{ encrypted_verifier: string }>();
  if (!pending) throw new Ga4Error('연결 요청을 다시 시작해 주세요.', 400);
  if (params.has('error')) return callbackRedirect('cancelled');
  const code = params.get('code');
  if (!code || code.length > 4096) throw new Ga4Error('Google 인증 코드를 확인하지 못했습니다.', 400);
  const token = await exchange({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: await unseal(pending.encrypted_verifier, `${user}|oauth|${stateHash}`) });
  if (!token.scope?.split(' ').includes(GA4_SCOPE) || !token.refresh_token) throw new Ga4Error('지속적인 읽기 권한이 승인되지 않았습니다. 다시 연결해 주세요.', 403);
  const probe = await dataApi(token.access_token, 'runReport', { dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }], metrics: [{ name: 'sessions' }], limit: '1' }) as ApiReport;
  const timezone = probe.metadata?.timeZone;
  if (!timezone) throw new Ga4Error('GA4 속성 시간대를 확인하지 못했습니다.', 502);
  // Validate the actual property's metric combinations before persisting consent.
  for (const shape of reportShapes()) {
    // Incompatible requested combinations fail the request. The response also lists OTHER fields.
    await dataApi(token.access_token, 'checkCompatibility', { dimensions: shape.dimensions, metrics: shape.metrics, ...(shape.dimensionFilter ? { dimensionFilter: shape.dimensionFilter } : {}) });
  }
  const id = crypto.randomUUID();
  const saved = await db.batch([
    db.prepare("INSERT INTO ga4_connections (user_id, id, clinic_id, property_id, encrypted_token, timezone, connected_at, needs_reconnect) SELECT ?, ?, ?, ?, ?, ?, ?, 0 FROM ga4_oauth_states WHERE state_hash = ? AND user_id = ? AND binding_hash = 'claimed' AND expires_at > ? ON CONFLICT(user_id) DO UPDATE SET id=excluded.id, clinic_id=excluded.clinic_id, property_id=excluded.property_id, encrypted_token=excluded.encrypted_token, timezone=excluded.timezone, connected_at=excluded.connected_at, last_fetched_at=NULL, needs_reconnect=0").bind(user, id, CLINIC, GA4_PROPERTY_ID, await seal(token.refresh_token, tokenContext(user, id)), timezone, new Date().toISOString(), stateHash, user, Date.now()),
    db.prepare('DELETE FROM ga4_oauth_states WHERE state_hash = ? AND user_id = ?').bind(stateHash, user),
  ]);
  if (!saved[0].meta.changes) throw new Ga4Error('연결 요청이 취소되었거나 변경됐습니다.', 409);
  return callbackRedirect('connected');
}
function reportShapes() {
  const metrics = (names: string[]) => names.map(name => ({ name }));
  const shape = (dimensions: string[], names: string[]) => ({ dimensions: metrics(dimensions), metrics: metrics(names), dimensionFilter: undefined as object | undefined });
  const ai = shape(['date', 'landingPage'], ['sessions']);
  ai.dimensionFilter = { andGroup: { expressions: [
    { filter: { fieldName: 'sessionSource', inListFilter: { values: AI_REFERRAL_SOURCES, caseSensitive: false } } },
    { filter: { fieldName: 'sessionMedium', stringFilter: { matchType: 'EXACT', value: 'referral', caseSensitive: false } } },
  ] } };
  return [shape([], ['sessions', 'activeUsers', 'keyEvents']), shape(['date'], ['sessions']), shape(['sessionSource', 'sessionMedium'], ['sessions']), ai, shape(['eventName'], ['eventCount'])];
}
export async function fetchGa4Report(user: string, params: URLSearchParams) {
  requireConfig();
  const row = await connection(user);
  if (!row || row.needs_reconnect) throw new Ga4Error('먼저 Google GA4 읽기 권한을 연결해 주세요.', 409);
  let dates;
  try { dates = reportDates(params, row.timezone); } catch (error) { throw new Ga4Error((error as Error).message); }
  let token;
  try { token = await exchange({ grant_type: 'refresh_token', refresh_token: await unseal(row.encrypted_token, tokenContext(user, row.id)) }); }
  catch (error) { if (error instanceof Ga4Error && error.status === 401) await getDatabaseBinding().prepare('UPDATE ga4_connections SET needs_reconnect = 1 WHERE user_id = ? AND id = ?').bind(user, row.id).run(); throw error; }
  if (token.scope && !token.scope.split(' ').includes(GA4_SCOPE)) throw new Ga4Error('GA4 읽기 권한을 다시 승인해 주세요.', 403);
  // Store rotation only on the same live connection; a disconnect can never resurrect it.
  if (token.refresh_token) await getDatabaseBinding().prepare('UPDATE ga4_connections SET encrypted_token = ? WHERE user_id = ? AND id = ? AND needs_reconnect = 0').bind(await seal(token.refresh_token, tokenContext(user, row.id)), user, row.id).run();
  const result = await dataApi(token.access_token, 'batchRunReports', { requests: reportShapes().map(shape => ({ ...shape, dateRanges: [dates], limit: '10000' })) }) as { reports?: ApiReport[] };
  if (!result.reports) throw new Ga4Error('GA4 보고서가 반환되지 않았습니다.', 502);
  let report;
  try { report = summarizeGa4(result.reports, dates, row.timezone); } catch (error) { throw new Ga4Error((error as Error).message, 502); }
  // Recheck ownership/version after slow upstream calls, before revealing data.
  const current = await connection(user);
  if (!current || current.id !== row.id || current.needs_reconnect) throw new Ga4Error('연결 상태가 바뀌었습니다. 다시 조회해 주세요.', 409);
  await getDatabaseBinding().prepare('UPDATE ga4_connections SET last_fetched_at = ? WHERE user_id = ? AND id = ?').bind(report.fetchedAt, user, row.id).run();
  return report;
}
export async function disconnectGa4(user: string) {
  const db = getDatabaseBinding();
  await db.batch([db.prepare('DELETE FROM ga4_connections WHERE user_id = ? AND clinic_id = ?').bind(user, CLINIC), db.prepare('DELETE FROM ga4_oauth_states WHERE user_id = ?').bind(user)]);
  // Local disconnect only: Google project-wide revoke can invalidate other integrations.
  return privateJson({ disconnected: true });
}
