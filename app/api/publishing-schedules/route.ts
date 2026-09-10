import { desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { publishingQueueItems, publishingSchedules } from '@/db/schema';
import clinicData from '@/data/withyou-clinic.json';

type ScheduleInput = {
  intervalDays?: number;
  totalCount?: number;
  startDate?: string;
  publishTime?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function todayInKorea() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('no such table')) {
    return '발행 계획 저장소를 준비하는 중입니다. 잠시 후 다시 시도해 주세요.';
  }
  if (message.includes('저장소가 아직 연결')) {
    return message;
  }
  return '발행 계획을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export async function GET() {
  try {
    const db = getDb();
    const [schedule] = await db
      .select()
      .from(publishingSchedules)
      .orderBy(desc(publishingSchedules.createdAt))
      .limit(1);

    if (!schedule) {
      return Response.json({ schedule: null });
    }

    const items = await db
      .select()
      .from(publishingQueueItems)
      .where(eq(publishingQueueItems.scheduleId, schedule.id))
      .orderBy(publishingQueueItems.sequence);

    return Response.json({ schedule: { ...schedule, items } });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ScheduleInput;
    const intervalDays = Number(input.intervalDays);
    const totalCount = Number(input.totalCount);
    const startDate = input.startDate?.trim() ?? '';
    const publishTime = input.publishTime?.trim() ?? '';

    if (
      !Number.isInteger(intervalDays) ||
      intervalDays < 1 ||
      intervalDays > 30
    ) {
      return Response.json(
        { error: '발행 간격은 1일부터 30일 사이로 입력해 주세요.' },
        { status: 400 },
      );
    }
    if (!Number.isInteger(totalCount) || totalCount < 1 || totalCount > 30) {
      return Response.json(
        { error: '총 발행 개수는 1개부터 30개까지 설정할 수 있습니다.' },
        { status: 400 },
      );
    }
    if (!datePattern.test(startDate) || startDate < todayInKorea()) {
      return Response.json(
        { error: '첫 발행일은 오늘 이후 날짜로 선택해 주세요.' },
        { status: 400 },
      );
    }
    if (!timePattern.test(publishTime)) {
      return Response.json(
        { error: '발행 시간을 올바르게 선택해 주세요.' },
        { status: 400 },
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const scheduleId = crypto.randomUUID();
    const items = Array.from({ length: totalCount }, (_, index) => {
      const opportunity = clinicData.opportunities[index];
      const isFirstDraft = index === 0;
      const placeholderNumber = index + 1;
      const question =
        opportunity?.question ??
        `검색 데이터 기반 주제 자동 선정 #${placeholderNumber}`;
      const title = isFirstDraft
        ? clinicData.contentDraft.h1
        : (opportunity?.question.replace(/\?$/, '') ??
          `주제 자동 선정 예정 #${placeholderNumber}`);

      return {
        id: crypto.randomUUID(),
        scheduleId,
        sequence: index + 1,
        question,
        title,
        scheduledFor: `${addDays(startDate, index * intervalDays)}T${publishTime}:00+09:00`,
        status: isFirstDraft
          ? 'review_required'
          : opportunity
            ? 'draft_required'
            : 'topic_pending',
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.batch([
      db
        .update(publishingSchedules)
        .set({ status: 'replaced', updatedAt: now })
        .where(
          inArray(publishingSchedules.status, [
            'waiting_cms',
            'active',
            'paused',
          ]),
        ),
      db.insert(publishingSchedules).values({
        id: scheduleId,
        intervalDays,
        totalCount,
        startDate,
        publishTime,
        timezone: 'Asia/Seoul',
        status: 'waiting_cms',
        approvedOnly: true,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(publishingQueueItems).values(items),
    ]);

    return Response.json(
      {
        schedule: {
          id: scheduleId,
          intervalDays,
          totalCount,
          startDate,
          publishTime,
          timezone: 'Asia/Seoul',
          status: 'waiting_cms',
          approvedOnly: true,
          createdAt: now,
          updatedAt: now,
          items,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
