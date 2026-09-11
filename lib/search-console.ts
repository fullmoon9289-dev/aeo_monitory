export type SearchRow = { label: string; clicks: number; impressions: number; position: number };
export type SearchData = { dimension: 'query' | 'page'; rows: SearchRow[] };
export type SearchImport = SearchData & { id: string; clinicId: string; propertyUrl: string; startDate: string; endDate: string; filename: string; createdAt: string };
export const maxCsvBytes = 1_000_000;

// Search Console exports use quoted CSV cells, including commas in queries and numbers.
export function parseSearchCsv(source: string): SearchData {
  if (new TextEncoder().encode(source).length > maxCsvBytes) throw new Error('CSV는 1MB 이하로 가져와 주세요.');
  const input = source.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  let cells: string[] = [], cell = '', quoted = false, closed = false;
  const finishCell = () => { cells.push(cell.trim()); cell = ''; closed = false; };
  const finishRow = () => { finishCell(); if (cells.some(Boolean)) records.push(cells); cells = []; if (records.length > 1001) throw new Error('한 번에 최대 1,000행까지 분석할 수 있습니다.'); };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === ',') finishCell();
    else if (char === '\n' || char === '\r') { if (char === '\r' && input[i + 1] === '\n') i++; finishRow(); }
    else if (char === '"') { if (cell.trim() || closed) throw new Error('CSV의 따옴표 형식이 올바르지 않습니다. 원본 파일을 다시 내보내 주세요.'); quoted = true; cell = ''; }
    else { if (closed && char.trim()) throw new Error('CSV 셀 형식이 올바르지 않습니다.'); cell += char; }
  }
  if (quoted) throw new Error('CSV에 닫히지 않은 따옴표가 있습니다.');
  if (cell || cells.length || closed) finishRow();
  if (records.length < 2) throw new Error('분석할 행이 없습니다. 검색어 또는 페이지 보고서를 선택해 주세요.');
  const headers = records[0].map(value => value.toLowerCase().replace(/\s/g, ''));
  const column = (...names: string[]) => headers.findIndex(value => names.includes(value));
  const query = column('인기검색어', '상위검색어', '검색어', 'topqueries', 'queries', 'query');
  const page = column('인기페이지', '상위페이지', '페이지', 'toppages', 'pages', 'page');
  const clicks = column('클릭수', '클릭', 'clicks');
  const impressions = column('노출수', '노출', 'impressions');
  const position = column('게재순위', '평균게재순위', '평균순위', '순위', 'position', 'averageposition');
  if ((query < 0 && page < 0) || Math.min(clicks, impressions, position) < 0) throw new Error('검색어(또는 페이지), 클릭수, 노출수, 게재순위 열이 필요합니다. 날짜별 차트 파일은 지원하지 않습니다.');
  const labelIndex = query >= 0 ? query : page;
  const dimension = query >= 0 ? 'query' : 'page';
  const seen = new Set<string>();
  const rows = records.slice(1).map((record, index) => {
    if (record.length !== headers.length) throw new Error(`${index + 2}행의 열 개수가 다릅니다.`);
    const number = (columnIndex: number, integer = false) => {
      const raw = record[columnIndex].replace(/,/g, '');
      if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error(`${index + 2}행의 숫자 형식을 확인해 주세요.`);
      const value = Number(raw);
      if (!Number.isFinite(value) || value > 1e12 || (integer && !Number.isInteger(value))) throw new Error(`${index + 2}행의 숫자 범위가 올바르지 않습니다.`);
      return value;
    };
    const label = record[labelIndex];
    if (!label || label.length > 2048 || seen.has(label)) throw new Error(`${index + 2}행의 검색어 또는 페이지가 비어 있거나 중복됩니다.`);
    seen.add(label);
    if (dimension === 'page') { try { const url = new URL(label); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { throw new Error(`${index + 2}행의 페이지 주소를 확인해 주세요.`); } }
    const row = { label, clicks: number(clicks, true), impressions: number(impressions, true), position: number(position) };
    if (row.clicks > row.impressions || (row.impressions > 0 && row.position < 1)) throw new Error(`${index + 2}행의 클릭수·노출수·게재순위를 확인해 주세요.`);
    return row;
  });
  return { dimension, rows };
}

export function searchMetrics(rows: SearchRow[]) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions * 100 : 0, position: impressions ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions : null };
}
