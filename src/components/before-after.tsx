"use client";

import { useState } from 'react';

export interface BeforeAfterData {
  before: string;
  after: string;
  labelBefore?: string;
  labelAfter?: string;
  caption?: string;
}

export function BeforeAfterSlider({ data }: { data: BeforeAfterData }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 shadow-glow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">before / after</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{data.caption ?? 'Image comparison preview'}</h3>
        </div>
        <div className="flex gap-2 text-xs uppercase tracking-[0.35em] text-slate-500">
          <span>{data.labelBefore ?? 'before'}</span>
          <span className="text-slate-600">•</span>
          <span>{data.labelAfter ?? 'after'}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.after} alt="After" className="block h-full w-full object-cover" />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.before} alt="Before" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-y-0 left-[calc(50%-1px)] z-10 flex items-center justify-center">
          <div className="h-full w-0.5 bg-accent/70" />
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-950/90 ring-2 ring-accent" />
        </div>
      </div>

      <div className="mt-5">
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700/70 accent-accent"
        />
      </div>
    </div>
  );
}
