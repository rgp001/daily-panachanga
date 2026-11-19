import React from 'react';
import {
  formatDuration,
  formatEntryTimeRange,
  formatTime,
  formatTimeWithSeconds,
  roundToMinuteMs,
  type DailyPanchanga,
} from '../lib/astral';
import type { MoonRiseSetResult } from '../lib/panchanga';

interface DayArcStripProps {
  panchanga: DailyPanchanga;
  moonRiseSet: MoonRiseSetResult;
  nowMs: number;
  isToday: boolean;
}

export const DayArcStrip: React.FC<DayArcStripProps> = ({
  panchanga,
  moonRiseSet,
  nowMs,
  isToday,
}) => {
  const { location, entries, sunriseMs, sunsetMs, daylightDurationMs, nightDurationMs } =
    panchanga;

  const rahu = entries.find((e) => e.id === 'rahu-kalam');
  const madhyana = entries.find((e) => e.id === 'madhyana-kala');
  const nishita = entries.find((e) => e.id === 'nishita-kala');

  // 24-hour solar cycle bar spanning from today's sunrise to tomorrow's sunrise
  const cycleStart = sunriseMs;
  const cycleEnd = panchanga.nextSunriseMs;
  const cycleSpan =
    cycleStart !== null && cycleEnd !== null && cycleEnd > cycleStart
      ? cycleEnd - cycleStart
      : null;

  const toPct = (ms: number | null) => {
    if (cycleStart === null || cycleSpan === null || ms === null) return null;
    return Math.max(0, Math.min(100, ((ms - cycleStart) / cycleSpan) * 100));
  };

  const sunsetPct = toPct(sunsetMs);
  const nowPct = isToday ? toPct(nowMs) : null;

  const timelineWindows = [
    rahu && {
      label: 'Rahu Kalam',
      startPct: toPct(rahu.startMs),
      endPct: toPct(rahu.endMs),
      colorClass: 'bg-rose-500/80 dark:bg-rose-400/80',
    },
    madhyana && {
      label: 'Madhyana Kala',
      startPct: toPct(madhyana.startMs),
      endPct: toPct(madhyana.endMs),
      colorClass: 'bg-amber-600/85 dark:bg-amber-400/85',
    },
    nishita && {
      label: 'Nishita Kala',
      startPct: toPct(nishita.startMs),
      endPct: toPct(nishita.endMs),
      colorClass: 'bg-blue-600/85 dark:bg-blue-400/85',
    },
  ].filter(
    (
      w
    ): w is {
      label: string;
      startPct: number;
      endPct: number;
      colorClass: string;
    } => Boolean(w && w.startPct !== null && w.endPct !== null)
  );

  return (
    <section aria-label="Key solar and muhurat summary" className="space-y-4">
      {/* 4-column high-signal KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sunrise · Sunset
          </div>
          <div className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-slate-100">
            {sunriseMs !== null && sunsetMs !== null ? (
              <>
                <span>{formatTimeWithSeconds(sunriseMs, location.timezone)}</span>
                <span className="text-slate-400 mx-1.5">/</span>
                <span>{formatTimeWithSeconds(sunsetMs, location.timezone)}</span>
              </>
            ) : (
              'Polar Extremity'
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {daylightDurationMs !== null && nightDurationMs !== null
              ? `Day ${formatDuration(daylightDurationMs)} · Night ${formatDuration(nightDurationMs)}`
              : 'No horizon crossing'}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
            <span className="font-sans text-slate-500 dark:text-slate-400 mr-1.5">
              Moon:
            </span>
            <span>
              ↑{' '}
              {moonRiseSet.moonriseMs !== null
                ? formatTime(roundToMinuteMs(moonRiseSet.moonriseMs), location.timezone)
                : 'No rise'}
            </span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span>
              ↓{' '}
              {moonRiseSet.moonsetMs !== null
                ? formatTime(roundToMinuteMs(moonRiseSet.moonsetMs), location.timezone)
                : 'No set'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rahu Kalam
          </div>
          <div className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-rose-700 dark:text-rose-400">
            {rahu
              ? formatEntryTimeRange(rahu, location.timezone)
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {rahu ? `${rahu.formulaNote} · Inauspicious` : 'Unavailable'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Madhyana Kala
          </div>
          <div className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-amber-700 dark:text-amber-400">
            {madhyana
              ? formatEntryTimeRange(madhyana, location.timezone)
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {madhyana ? `${madhyana.formulaNote} · Midday` : 'Unavailable'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Nishita Kala
          </div>
          <div className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-blue-700 dark:text-blue-400">
            {nishita
              ? formatEntryTimeRange(nishita, location.timezone)
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {nishita ? `${nishita.formulaNote} · Night` : 'Unavailable'}
          </div>
        </div>
      </div>

      {/* 24-Hour Vedic Day-Night Cycle Timeline (Sunrise to Next Sunrise) */}
      {cycleSpan !== null && sunsetPct !== null && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Vedic Solar Day Timeline (Sunrise to Next Sunrise)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/80 inline-block" />
                Rahu Kalam
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-600/85 inline-block" />
                Madhyana Kala
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600/85 inline-block" />
                Nishita Kala
              </span>
            </div>
          </div>

          <div className="relative h-7 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            {/* Daytime segment */}
            <div
              className="absolute inset-y-0 left-0 bg-amber-50 dark:bg-amber-950/25 border-r border-slate-300 dark:border-slate-700"
              style={{ width: `${sunsetPct}%` }}
              title="Daylight (Dinamana)"
            />
            {/* Nighttime segment */}
            <div
              className="absolute inset-y-0 right-0 bg-slate-100 dark:bg-slate-900/90"
              style={{ width: `${100 - sunsetPct}%` }}
              title="Nighttime (Ratrimana)"
            />

            {/* Highlighted Kala Windows */}
            {timelineWindows.map((win) => (
              <div
                key={win.label}
                title={win.label}
                className={`absolute inset-y-1 rounded-xs ${win.colorClass}`}
                style={{
                  left: `${win.startPct}%`,
                  width: `${Math.max(0.8, win.endPct - win.startPct)}%`,
                }}
              />
            ))}

            {/* Current Time Needle (when viewing Today) */}
            {nowPct !== null && (
              <div
                className="absolute inset-y-0 w-0.5 bg-slate-950 dark:bg-white z-10"
                style={{ left: `${nowPct}%` }}
                title="Current time"
              />
            )}
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>
              Sunrise{' '}
              {sunriseMs !== null
                ? formatTimeWithSeconds(sunriseMs, location.timezone)
                : ''}
            </span>
            <span style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              Sunset{' '}
              {sunsetMs !== null
                ? formatTimeWithSeconds(sunsetMs, location.timezone)
                : ''}
            </span>
            <span>
              Next Sunrise{' '}
              {panchanga.nextSunriseMs !== null
                ? formatTimeWithSeconds(
                    panchanga.nextSunriseMs,
                    location.timezone
                  )
                : ''}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
