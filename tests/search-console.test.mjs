import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchCsv, searchMetrics } from '../lib/search-console.ts';

test('Korean export: BOM, quoted comma, CRLF, weighted metrics', () => {
  const data = parseSearchCsv('\uFEFF인기 검색어,클릭수,노출수,CTR,게재 순위\r\n"전립선, 검사",10,"1,000",1%,2.5\r\n골드만,20,200,10%,4\r\n');
  assert.equal(data.dimension, 'query');
  assert.equal(data.rows[0].label, '전립선, 검사');
  assert.deepEqual(searchMetrics(data.rows), { clicks: 30, impressions: 1200, ctr: 2.5, position: 2.75 });
});
test('English page export and zero impressions', () => {
  const data = parseSearchCsv('Top pages,Clicks,Impressions,CTR,Position\nhttps://www.gold-man.com/,0,0,0%,0');
  assert.equal(data.dimension, 'page'); assert.equal(searchMetrics(data.rows).position, null);
});
test('escaped quotes and multiline query round trip', () => {
  const data = parseSearchCsv('Top queries,Clicks,Impressions,Position\n"a ""quoted""\nquery",1,2,1');
  assert.equal(data.rows[0].label, 'a "quoted"\nquery');
});
for (const [name, csv] of [
  ['date report', 'Date,Clicks,Impressions,Position\n2026-09-01,1,10,1'],
  ['malformed quote', 'Top queries,Clicks,Impressions,Position\n"missing,1,10,2'],
  ['trailing quote text', 'Top queries,Clicks,Impressions,Position\n"a"extra,1,10,2'],
  ['negative metric', 'Top queries,Clicks,Impressions,Position\na,-1,10,2'],
  ['missing metric', 'Top queries,Clicks,Impressions,Position\na,,10,2'],
  ['invalid fraction', 'Top queries,Clicks,Impressions,Position\na,1.5,10,2'],
  ['impossible clicks', 'Top queries,Clicks,Impressions,Position\na,11,10,2'],
  ['duplicate row', 'Top queries,Clicks,Impressions,Position\na,1,10,2\na,1,10,2'],
  ['executable page URL', 'Top pages,Clicks,Impressions,Position\njavascript:alert(1),1,10,2'],
]) test(`rejects ${name}`,()=> assert.throws(()=>parseSearchCsv(csv)));
test('row and byte limits',()=> {
  assert.throws(()=>parseSearchCsv('Top queries,Clicks,Impressions,Position\n'+Array.from({length:1001},(_,i)=>`q${i},1,10,1`).join('\n')));
  assert.throws(()=>parseSearchCsv('x'.repeat(1_000_001)));
});
