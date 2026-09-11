'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  FileClock,
  Link2,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { plannedTopic, validDate, type ClinicId } from '@/lib/clinics';

type QueueStatus = 'review_required' | 'draft_required' | 'topic_pending';

type QueueItem = {
  id: string;
  sequence: number;
  question: string;
  title: string;
  scheduledFor: string;
  status: QueueStatus;
};

type PublishingSchedule = {
  id: string;
  intervalDays: number;
  totalCount: number;
  startDate: string;
  publishTime: string;
  timezone: string;
  status: string;
  approvedOnly: boolean;
  createdAt: string;
  updatedAt: string;
  items: QueueItem[];
};

const presets = [
  { days: 1, label: '매일 1개' },
  { days: 2, label: '2일마다 1개' },
  { days: 7, label: '매주 1개' },
];

const statusMeta: Record<
  QueueStatus,
  { label: string; className: string; description: string }
> = {
  review_required: {
    label: '의료진 검수 대기',
    className: 'bg-[#fff2e6] text-[#b76925]',
    description: '초안 완료',
  },
  draft_required: {
    label: '초안 준비 필요',
    className: 'bg-[#f0edff] text-[#5d49d2]',
    description: '주제 선정 완료',
  },
  topic_pending: {
    label: '추가 주제 선정 필요',
    className: 'bg-[#f1f0f4] text-[#777381]',
    description: '담당자 주제 선정 대기',
  },
};

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function koreaDate(offsetDays = 0) {
  const value = new Date(Date.now() + 9 * 60 * 60 * 1000);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return `${month}월 ${day}일(${weekday})`;
}

function formatScheduledAt(value: string) {
  return `${formatDate(value.slice(0, 10))} ${value.slice(11, 16)}`;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;
  return minute === 0
    ? `${period} ${displayHour}시`
    : `${period} ${displayHour}:${String(minute).padStart(2, '0')}`;
}

function makePreviewItems(
  clinicId: ClinicId,
  startDate: string,
  publishTime: string,
  intervalDays: number,
  totalCount: number,
): QueueItem[] {
  if (!validDate(startDate)) return [];
  return Array.from({ length: totalCount }, (_, index) => ({
    id: `preview-${index}`,
    sequence: index + 1,
    ...plannedTopic(clinicId, index),
    scheduledFor: `${addDays(startDate, index * intervalDays)}T${publishTime}:00+09:00`,
  }));
}

export function PublishingScheduler({
  clinicId = 'withyou-clinic',
  onOpenSettings,
}: {
  clinicId?: ClinicId;
  onOpenSettings: () => void;
}) {
  const [intervalDays, setIntervalDays] = useState(1);
  const [totalCount, setTotalCount] = useState(7);
  const [startDate, setStartDate] = useState(() => koreaDate(1));
  const [publishTime, setPublishTime] = useState('09:00');
  const [schedule, setSchedule] = useState<PublishingSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setSchedule(null); setError(''); setNotice('');
    fetch(`/api/publishing-schedules?clinicId=${clinicId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          schedule?: PublishingSchedule | null;
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error ?? '일정을 불러오지 못했습니다.');
        if (controller.signal.aborted) return;
        if (data.schedule) {
          setSchedule(data.schedule);
          setIntervalDays(data.schedule.intervalDays);
          setTotalCount(data.schedule.totalCount);
          setStartDate(data.schedule.startDate);
          setPublishTime(data.schedule.publishTime);
        }
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : '일정을 불러오지 못했습니다.',
        );
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clinicId]);

  const previewItems = useMemo(
    () => makePreviewItems(clinicId, startDate, publishTime, intervalDays, totalCount),
    [clinicId, intervalDays, publishTime, startDate, totalCount],
  );
  const lastDate = previewItems.at(-1)?.scheduledFor.slice(0, 10) ?? '';
  const formMatchesSaved =
    schedule?.intervalDays === intervalDays &&
    schedule?.totalCount === totalCount &&
    schedule?.startDate === startDate &&
    schedule?.publishTime === publishTime;
  const displayedItems =
    schedule && formMatchesSaved ? schedule.items : previewItems;

  const saveSchedule = async () => {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/publishing-schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          intervalDays,
          totalCount,
          startDate,
          publishTime,
        }),
      });
      const data = (await response.json()) as {
        schedule?: PublishingSchedule;
        error?: string;
      };
      if (!response.ok || !data.schedule) {
        throw new Error(data.error ?? '발행 계획을 저장하지 못했습니다.');
      }
      setSchedule(data.schedule);
      setNotice('발행 계획과 콘텐츠 대기열을 저장했습니다.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '발행 계획을 저장하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[#ddd8ef] bg-white shadow-[0_14px_42px_rgba(45,38,78,.07)]">
      <div className="flex flex-col gap-4 border-b border-[#efedf3] bg-[linear-gradient(135deg,#fbfaff_0%,#f5f2ff_100%)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#6957e8] text-white shadow-[0_8px_22px_rgba(105,87,232,.25)]">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">콘텐츠 발행 계획</h2>
              {schedule ? (
                <Badge className="bg-[#e8f7f1] text-[#218462]">
                  <Check className="size-3" /> 일정 저장됨
                </Badge>
              ) : (
                <Badge variant="outline">아직 저장 전</Badge>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-5 text-[#777381]">
              발행 간격과 총 개수를 정하면 날짜별 콘텐츠 대기열을 자동으로
              만듭니다.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-[#e7d6bb] bg-[#fffaf0] px-4 py-3 text-[10px] leading-4 text-[#8b672d]">
          <div className="flex items-center gap-1.5 font-bold">
            <CircleAlert className="size-3.5" /> 게시 연동 전
          </div>
          현재는 일정만 저장됩니다. 실제 게시 기능은 제공하지 않습니다.
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[.86fr_1.14fr]">
        <div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
              <div className="text-xs font-bold">발행 간격</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setIntervalDays(preset.days)}
                    className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${intervalDays === preset.days ? 'border-[#6957e8] bg-[#f0edff] text-[#5946d4]' : 'border-[#e7e4ed] bg-white text-[#686472] hover:border-[#cfc8f6]'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#f8f7fa] px-3 py-2">
                <span className="text-[11px] text-[#777381]">직접 설정</span>
                <Input
                  aria-label="직접 설정할 발행 간격"
                  type="number"
                  min={1}
                  max={30}
                  value={intervalDays}
                  onChange={(event) =>
                    setIntervalDays(
                      Math.min(
                        30,
                        Math.max(1, Number(event.target.value) || 1),
                      ),
                    )
                  }
                  className="h-8 w-20 bg-white text-center text-xs"
                />
                <span className="text-[11px] font-semibold">일마다 1개</span>
              </div>
            </div>

            <div>
              <label htmlFor="content-count" className="text-xs font-bold">
                총 발행 개수
              </label>
              <Input
                id="content-count"
                type="number"
                min={1}
                max={30}
                value={totalCount}
                onChange={(event) =>
                  setTotalCount(
                    Math.min(30, Math.max(1, Number(event.target.value) || 1)),
                  )
                }
                className="mt-2"
              />
              <div className="mt-2 flex gap-1.5">
                {[7, 14, 30].map((count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setTotalCount(count)}
                    className="rounded-lg border border-[#e7e4ed] px-2.5 py-1 text-[10px] font-semibold text-[#777381] hover:border-[#cfc8f6]"
                  >
                    {count}개
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="schedule-start-date"
                className="text-xs font-bold"
              >
                첫 발행 날짜
              </label>
              <Input
                id="schedule-start-date"
                type="date"
                min={koreaDate()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2"
              />
              <label
                htmlFor="schedule-publish-time"
                className="mt-3 block text-xs font-bold"
              >
                발행 시간 <span className="text-[#9a96a3]">(KST)</span>
              </label>
              <Input
                id="schedule-publish-time"
                type="time"
                value={publishTime}
                onChange={(event) => setPublishTime(event.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#252331] p-4 text-white">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#c2b8ff]">
              <Clock3 className="size-3.5" /> 계획 요약
            </div>
            <p className="mt-2 text-sm font-bold leading-6">
              {validDate(startDate) ? formatDate(startDate) : '날짜 선택'}부터{' '}
              {intervalDays}일마다 {formatTime(publishTime)}, 총 {totalCount}개
            </p>
            <p className="mt-1 text-[10px] text-white/50">
              마지막 계획일 {lastDate ? formatDate(lastDate) : '—'}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {previewItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-white/[.08] px-2.5 py-1 text-[9px] text-white/65"
                >
                  {item.sequence}회 ·{' '}
                  {formatDate(item.scheduledFor.slice(0, 10))}
                </span>
              ))}
            </div>
          </div>

          {notice ? (
            <div className="mt-3 rounded-xl bg-[#edf9f4] px-3 py-2.5 text-[11px] font-semibold text-[#237a5d]">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-xl bg-[#fff1f2] px-3 py-2.5 text-[11px] font-semibold text-[#b74a55]">
              {error}
            </div>
          ) : null}

          <Button
            onClick={saveSchedule}
            disabled={saving || loading || !validDate(startDate) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(publishTime) || formMatchesSaved}
            className="mt-4 w-full bg-[#6957e8] hover:bg-[#5845d5]"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {schedule ? '변경한 발행 계획 저장' : '발행 계획 저장'}
          </Button>
          <p className="mt-2 text-center text-[10px] leading-4 text-[#9692a0]">
            저장은 자동 발행 승인이 아닙니다. 의료진이 승인하지 않은 콘텐츠는
            예정 시간이 되어도 발행되지 않습니다.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">콘텐츠 대기열</h3>
              <p className="mt-1 text-[10px] text-[#9692a0]">
                저장한 순서를 기준으로 담당자가 초안 작성과 검수를 진행합니다.
              </p>
            </div>
            <Badge variant="outline" className="h-7">
              <FileClock className="size-3" /> 총 {displayedItems.length}개
            </Badge>
          </div>

          <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-[#e8e6ee]">
            {loading ? (
              <div className="grid min-h-48 place-items-center text-xs text-[#8f8b98]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> 저장된 계획 확인
                  중
                </span>
              </div>
            ) : (
              <div className="divide-y divide-[#efedf3]">
                {displayedItems.map((item) => {
                  const meta = statusMeta[item.status];
                  return (
                    <div
                      key={item.id}
                      className="grid gap-3 p-3.5 sm:grid-cols-[38px_108px_1fr_auto] sm:items-center"
                    >
                      <span className="grid size-8 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-black text-[#6957e8]">
                        {String(item.sequence).padStart(2, '0')}
                      </span>
                      <div className="text-[10px]">
                        <div className="font-bold">
                          {formatScheduledAt(item.scheduledFor)}
                        </div>
                        <div className="mt-1 text-[#9a96a3]">대한민국 시간</div>
                      </div>
                      <div className="min-w-0">
                        <div
                          className="truncate text-xs font-semibold"
                          title={item.title}
                        >
                          {item.title}
                        </div>
                        <div className="mt-1 text-[10px] text-[#9a96a3]">
                          {meta.description}
                        </div>
                      </div>
                      <Badge
                        className={`${meta.className} justify-self-start text-[9px]`}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-start gap-2 rounded-xl border border-[#d9d4f4] bg-[#f7f5ff] p-3 text-[10px] leading-5 text-[#625a7c]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6957e8]" />
              이 목록은 편집 계획입니다. 의료진 검토와 실제 게시는 담당자가 별도로 진행해야 합니다.
            </div>
            <Button onClick={onOpenSettings} variant="outline" size="sm">
              <Link2 className="size-3.5" /> {clinicId === 'goldman-clinic' ? '검색 자료 가져오기' : '연결 설정 보기'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
