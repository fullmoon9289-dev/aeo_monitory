import { getDatabaseBinding } from '@/db';
import { isClinicId, plannedTopic, validDate, type ClinicId } from '@/lib/clinics';

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

async function readSchedule(clinicId: ClinicId) {
  const db = getDatabaseBinding();
  const schedule = await db.prepare(`SELECT id, clinic_id AS clinicId, interval_days AS intervalDays, total_count AS totalCount, start_date AS startDate, publish_time AS publishTime, timezone, status, approved_only AS approvedOnly, created_at AS createdAt, updated_at AS updatedAt FROM publishing_schedules WHERE clinic_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`).bind(clinicId).first<{ id: string; approvedOnly: number; [key: string]: unknown }>();
  if (!schedule) return null;
  const { results: items } = await db.prepare(`SELECT id, sequence, question, title, scheduled_for AS scheduledFor, status FROM publishing_queue_items WHERE schedule_id = ? ORDER BY sequence`).bind(schedule.id).all();
  return { ...schedule, approvedOnly: Boolean(schedule.approvedOnly), items };
}

export async function GET(request: Request) {
  const clinicId = new URL(request.url).searchParams.get('clinicId') ?? 'withyou-clinic';
  if (!isClinicId(clinicId)) return Response.json({ error: '병원을 선택해 주세요.' }, { status: 400 });
  try { return Response.json({ schedule: await readSchedule(clinicId) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: '발행 계획 저장소를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try { input = await request.json(); if (!input || typeof input !== 'object') throw new Error(); }
  catch { return Response.json({ error: '요청 형식을 확인해 주세요.' }, { status: 400 }); }
  const clinicId = input.clinicId ?? 'withyou-clinic';
  const intervalDays = Number(input.intervalDays), totalCount = Number(input.totalCount);
  const startDate = typeof input.startDate === 'string' ? input.startDate.trim() : '';
  const publishTime = typeof input.publishTime === 'string' ? input.publishTime.trim() : '';
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  if (!isClinicId(clinicId)) return Response.json({ error: '병원을 선택해 주세요.' }, { status: 400 });
  if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 30 || !Number.isInteger(totalCount) || totalCount < 1 || totalCount > 30) return Response.json({ error: '발행 간격과 개수는 1부터 30까지 입력해 주세요.' }, { status: 400 });
  if (!validDate(startDate) || startDate < today || startDate > '2100-12-31') return Response.json({ error: '첫 발행일은 오늘부터 2100년 사이의 유효한 날짜로 선택해 주세요.' }, { status: 400 });
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(publishTime)) return Response.json({ error: '발행 시간을 올바르게 선택해 주세요.' }, { status: 400 });
  const now = new Date().toISOString(), scheduleId = crypto.randomUUID();
  const items = Array.from({ length: totalCount }, (_, index) => ({
    id: crypto.randomUUID(), sequence: index + 1, ...plannedTopic(clinicId, index), scheduledFor: `${addDays(startDate, index * intervalDays)}T${publishTime}:00+09:00`,
  }));
  try {
    const db = getDatabaseBinding();
    await db.batch([
      db.prepare(`UPDATE publishing_schedules SET status = 'replaced', updated_at = ? WHERE clinic_id = ? AND status IN ('waiting_cms', 'active', 'paused')`).bind(now, clinicId),
      db.prepare(`INSERT INTO publishing_schedules (id, clinic_id, interval_days, total_count, start_date, publish_time, timezone, status, approved_only, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'Asia/Seoul', 'waiting_cms', 1, ?, ?)`).bind(scheduleId, clinicId, intervalDays, totalCount, startDate, publishTime, now, now),
      ...items.map(item => db.prepare(`INSERT INTO publishing_queue_items (id, schedule_id, sequence, question, title, scheduled_for, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(item.id, scheduleId, item.sequence, item.question, item.title, item.scheduledFor, item.status, now, now)),
    ]);
    return Response.json({ schedule: { id: scheduleId, clinicId, intervalDays, totalCount, startDate, publishTime, timezone: 'Asia/Seoul', status: 'waiting_cms', approvedOnly: true, createdAt: now, updatedAt: now, items } }, { status: 201 });
  } catch { return Response.json({ error: '발행 계획을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 }); }
}
