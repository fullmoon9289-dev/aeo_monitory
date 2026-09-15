'use client';

import type { ReactNode } from 'react';
import { Activity } from 'lucide-react';

export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-1 text-xs font-semibold text-[#7160dc]">
          {eyebrow}
        </div>
        <h1 className="text-[26px] font-bold tracking-[-.035em] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777381]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  unit,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-[0_2px_10px_rgba(31,28,45,.025)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#7e7a89]">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-[30px] font-bold leading-none tracking-[-.04em]">
          {value}
        </span>
        <span className="mb-0.5 text-xs text-[#9c98a6]">{unit}</span>
      </div>
      <div className="mt-3 text-[11px] text-[#777381]">{note}</div>
    </div>
  );
}
