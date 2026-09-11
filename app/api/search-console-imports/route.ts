import { getDatabaseBinding } from '@/db';
import { clinics, isClinicId, validDate } from '@/lib/clinics';
import { maxCsvBytes, parseSearchCsv } from '@/lib/search-console';

export async function GET(request: Request) {
  const clinicId = new URL(request.url).searchParams.get('clinicId');
  if (!isClinicId(clinicId)) return Response.json({ error: '병원을 선택해 주세요.' }, { status: 400 });
  try {
    const row = await getDatabaseBinding().prepare(`SELECT id, clinic_id AS clinicId, property_url AS propertyUrl, start_date AS startDate, end_date AS endDate, dimension, filename, rows_json AS rowsJson, created_at AS createdAt FROM search_console_imports WHERE clinic_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`).bind(clinicId).first<{ rowsJson: string; [key: string]: unknown }>();
    if (!row) return Response.json({ report: null }, { headers: { 'Cache-Control': 'no-store' } });
    const { rowsJson, ...metadata } = row;
    return Response.json({ report: { ...metadata, rows: JSON.parse(rowsJson) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: '저장된 검색 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  let raw: string;
  try { raw = await request.text(); } catch { return Response.json({ error: '파일을 읽지 못했습니다.' }, { status: 400 }); }
  if (new TextEncoder().encode(raw).length > maxCsvBytes + 100_000) return Response.json({ error: '요청 파일이 너무 큽니다.' }, { status: 413 });
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); if (!input || typeof input !== 'object') throw new Error(); } catch { return Response.json({ error: '요청 형식을 확인해 주세요.' }, { status: 400 }); }
  const { clinicId, propertyUrl, startDate, endDate, csv, filename } = input;
  if (!isClinicId(clinicId)) return Response.json({ error: '병원을 선택해 주세요.' }, { status: 400 });
  if (typeof startDate !== 'string' || typeof endDate !== 'string' || !validDate(startDate) || !validDate(endDate) || startDate > endDate || endDate > new Date().toISOString().slice(0, 10)) return Response.json({ error: '서치콘솔에서 내보낸 실제 조회 기간을 입력해 주세요.' }, { status: 400 });
  if (typeof csv !== 'string' || typeof filename !== 'string' || filename.length > 180 || !filename.toLowerCase().endsWith('.csv') || propertyUrl !== clinics[clinicId].url || input.propertyConfirmed !== true) return Response.json({ error: '선택한 병원의 CSV 파일과 속성을 확인해 주세요.' }, { status: 400 });
  let data;
  try {
    data = parseSearchCsv(csv);
    if (data.dimension === 'page' && data.rows.some(row => { const host = new URL(row.label).hostname; return host !== clinics[clinicId].domain && !host.endsWith(`.${clinics[clinicId].domain}`); })) throw new Error('다른 병원 도메인의 페이지가 포함되어 있습니다. 선택한 병원과 파일을 확인해 주세요.');
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'CSV 형식을 확인해 주세요.' }, { status: 400 }); }
  const report = { id: crypto.randomUUID(), clinicId, propertyUrl, startDate, endDate, filename, createdAt: new Date().toISOString(), ...data };
  try {
    await getDatabaseBinding().prepare(`INSERT INTO search_console_imports (id, clinic_id, property_url, start_date, end_date, dimension, filename, row_count, rows_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(report.id, clinicId, propertyUrl, startDate, endDate, data.dimension, filename, data.rows.length, JSON.stringify(data.rows), report.createdAt).run();
    return Response.json({ report }, { status: 201 });
  } catch { return Response.json({ error: '분석을 저장하지 못했습니다. 파일은 유지되므로 다시 시도할 수 있습니다.' }, { status: 503 }); }
}
