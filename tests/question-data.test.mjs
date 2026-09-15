import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { registerHooks } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';

// Exercise the real route SQL with an in-memory SQLite adapter; no production records.
const root = new URL('../', import.meta.url);
const database = new DatabaseSync(':memory:');
for (const file of readdirSync(new URL('drizzle/', root)).filter(file => file.endsWith('.sql')).sort()) database.exec(readFileSync(new URL(`drizzle/${file}`, root), 'utf8'));
globalThis.__questionTestDb = {
  prepare(sql) {
    const statement = database.prepare(sql);
    const bound = values => ({
      bind: (...next) => bound(next),
      first: async () => statement.get(...values) ?? null,
      all: async () => ({ results: statement.all(...values) }),
      run: async () => statement.run(...values),
    });
    return bound([]);
  },
  async batch(statements) { database.exec('BEGIN'); try { const result = []; for (const statement of statements) result.push(await statement.run()); database.exec('COMMIT'); return result; } catch (error) { database.exec('ROLLBACK'); throw error; } },
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/db') return { url: 'data:text/javascript,export function getDatabaseBinding(){return globalThis.__questionTestDb}', shortCircuit:true };
    if (specifier.startsWith('@/')) return { url: new URL(`${specifier.slice(2)}${specifier.endsWith('.json') ? '' : '.ts'}`, root).href, shortCircuit:true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.json')) return { format:'module', source:`export default ${readFileSync(new URL(url), 'utf8')}`, shortCircuit:true };
    return next(url, context);
  },
});
const { GET: getQuestions } = await import('../app/api/question-opportunities/route.ts');
const { POST: savePlan, GET: getPlan } = await import('../app/api/publishing-schedules/route.ts');
const { POST: saveImport } = await import('../app/api/search-console-imports/route.ts');
const { planTopics } = await import('../lib/clinics.ts');
const request = (path, body) => new Request(`http://localhost/api/${path}`, body ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : undefined);
async function importReport({ clinicId='withyou-clinic', propertyUrl='https://withyouclinic.com/', endDate='2026-09-12', csv='Top queries,Clicks,Impressions,Position\n아토피 검사,2,100,8\n알레르기 치료,3,200,9', startDate='2026-08-16' }={}) {
  const response = await saveImport(request('search-console-imports', { clinicId, propertyUrl, startDate, endDate, csv, filename:'synthetic.csv', propertyConfirmed:true }));
  assert.equal(response.status, 201);
  return (await response.json()).report;
}
async function current(clinic='withyou-clinic') { return (await (await getQuestions(request(`question-opportunities?clinicId=${clinic}`))).json()).questionSet; }

test('end-to-end: query imports update questions and version while old reports and page imports do not replace them', async () => {
  assert.equal((await current()).source, null);
  const first = await importReport();
  assert.equal((await current()).source.id, first.id);
  await importReport({ endDate:'2026-09-01', csv:'Top queries,Clicks,Impressions,Position\n피부염 증상,1,9999,8' });
  await importReport({ csv:'Top pages,Clicks,Impressions,Position\nhttps://withyouclinic.com/,10,2000,5' });
  assert.equal((await current()).source.id, first.id);
  await importReport({ clinicId:'goldman-clinic', propertyUrl:'https://www.gold-man.com/', csv:'Top queries,Clicks,Impressions,Position\n전립선 검사,5,500,9' });
  assert.match((await current('goldman-clinic')).items[0].question, /전립선/);
  assert.ok((await current()).items.every(item => !item.question.includes('전립선')));
  const second = await importReport({ endDate:'2026-09-13', csv:'Top queries,Clicks,Impressions,Position\n건선 치료,4,300,7' });
  assert.equal((await current()).source.id, second.id);
  assert.equal((await current()).items.length, 1);
  assert.match((await current()).items[0].question, /건선/);
});

test('schedules save the viewed version, retain selected topics and reject stale preview versions', async () => {
  const set = await current();
  const payload = { clinicId:'withyou-clinic', intervalDays:1, totalCount:3, startDate:'2099-01-01', publishTime:'09:00', questionVersion:set.version, scheduleId:null };
  const response = await savePlan(request('publishing-schedules', payload));
  assert.equal(response.status, 201);
  const { schedule } = await response.json();
  assert.equal(schedule.items[0].question, set.items[0].question);
  assert.equal(schedule.items[1].status, 'topic_pending');
  await importReport({ endDate:'2026-09-14', csv:'Top queries,Clicks,Impressions,Position\n두드러기 검사,2,999,6' });
  const stale = await savePlan(request('publishing-schedules', { ...payload, scheduleId:schedule.id, publishTime:'10:00' }));
  assert.equal(stale.status, 409);
  const unchanged = await (await getPlan(request('publishing-schedules?clinicId=withyou-clinic'))).json();
  assert.equal(unchanged.schedule.id, schedule.id);
  assert.deepEqual(unchanged.schedule.items, schedule.items);
  const updated = await savePlan(request('publishing-schedules', { ...payload, scheduleId:schedule.id, questionVersion:(await current()).version, publishTime:'10:00' }));
  assert.equal(updated.status, 201);
  const next = (await updated.json()).schedule;
  assert.equal(next.items[0].question, schedule.items[0].question);
  assert.match(next.items[1].question, /두드러기/);
  assert.equal(next.items[2].status, 'topic_pending');
});

test('a draft remains review-required after query updates and duplicate candidate is not requeued', () => {
  const original = planTopics('withyou-clinic', 2);
  assert.equal(original[0].status, 'review_required');
  const next = planTopics('withyou-clinic', 3, [original[0].question, '아토피 생활관리 질문'], original);
  assert.deepEqual(next[0], original[0]);
  assert.equal(next[2].question, '아토피 생활관리 질문');
});

test('invalid clinic never reads another clinic data', async () => {
  assert.equal((await getQuestions(request('question-opportunities?clinicId=unknown'))).status, 400);
});
