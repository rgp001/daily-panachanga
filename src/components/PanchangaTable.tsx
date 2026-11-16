import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  formatDuration,
  formatEntryTimeRange,
  formatShortDate,
  getTimezoneShortCode,
  type DailyPanchanga,
  type PanchangaEntry,
  type TimingNature,
} from '../lib/astral';

export type TableFilter = 'all' | 'auspicious' | 'inauspicious' | 'solar';

interface PanchangaTableProps {
  panchanga: DailyPanchanga;
  nowMs: number;
  isToday: boolean;
  showAllSeconds: boolean;
  onToggleSeconds: () => void;
  tvMode: boolean;
  onToggleTvMode: () => void;
}

function getLiveStatus(
  entry: PanchangaEntry,
  nowMs: number,
  isToday: boolean
): 'active' | 'upcoming' | 'elapsed' | null {
  if (!isToday) return null;
  if (entry.isInstant) {
    if (Math.abs(nowMs - entry.startMs) <= 60_000) return 'active';
    return nowMs < entry.startMs ? 'upcoming' : 'elapsed';
  }
  if (nowMs >= entry.startMs && nowMs <= entry.endMs) return 'active';
  return nowMs < entry.startMs ? 'upcoming' : 'elapsed';
}

function natureTextClass(nature: TimingNature): string {
  switch (nature) {
    case 'auspicious':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'inauspicious':
      return 'text-rose-700 dark:text-rose-400';
    case 'neutral':
      return 'text-amber-700 dark:text-amber-400';
    case 'solar':
      return 'text-blue-700 dark:text-blue-400';
  }
}

export const PanchangaTable: React.FC<PanchangaTableProps> = ({
  panchanga,
  nowMs,
  isToday,
  showAllSeconds,
  onToggleSeconds,
  tvMode,
  onToggleTvMode,
}) => {
  const [filter, setFilter] = useState<TableFilter>('all');
  const [copied, setCopied] = useState(false);

  const tzCode = getTimezoneShortCode(
    panchanga.location.timezone,
    panchanga.dateStr
  );

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return panchanga.entries;
    if (filter === 'auspicious') {
      return panchanga.entries.filter(
        (e) => e.nature === 'auspicious' || e.nature === 'neutral'
      );
    }
    if (filter === 'inauspicious') {
      return panchanga.entries.filter((e) => e.nature === 'inauspicious');
    }
    return panchanga.entries.filter((e) => e.nature === 'solar');
  }, [panchanga.entries, filter]);

  const handleCopyTable = async () => {
    const lines = [
      `${panchanga.location.name} (${panchanga.location.latitude.toFixed(4)}°, ${panchanga.location.longitude.toFixed(4)}°) — ${formatShortDate(panchanga.dateStr)} (${panchanga.weekdayName}) [${tzCode}]`,
      ...panchanga.entries.map(
        (entry) =>
          `${entry.name}: ${formatEntryTimeRange(
            entry,
            panchanga.location.timezone,
            showAllSeconds
          )} (${entry.natureLabel})`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts; ignore silently
    }
  };

  if (panchanga.polarCondition !== 'normal') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          No Horizon Sunrise or Sunset on {formatShortDate(panchanga.dateStr)}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          At latitude {panchanga.location.latitude.toFixed(4)}°, this date experiences{' '}
          {panchanga.polarCondition === 'polar_day'
            ? 'continuous daylight (midnight sun)'
            : 'continuous night (polar night)'}
          . Vedic sunrise-based daylight and night divisions are undefined without a horizon crossing.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Daily Panchanga and Muhurat Table"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2
            className={`font-serif font-semibold text-slate-900 dark:text-slate-100 ${
              tvMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            }`}
          >
            Daily Muhurat &amp; Kala Schedule
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>{panchanga.location.name}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{panchanga.weekdayName} ({panchanga.varaName})</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="font-mono tabular-nums">
              {formatShortDate(panchanga.dateStr)}
            </span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="font-mono">{tzCode}</span>
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2.5">
          {/* Category Filter Segmented Bar */}
          <div
            role="tablist"
            aria-label="Filter timings by category"
            className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {(
              [
                { id: 'all', label: 'All Timings' },
                { id: 'auspicious', label: 'Auspicious' },
                { id: 'inauspicious', label: 'Inauspicious' },
                { id: 'solar', label: 'Solar Events' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alexa Rounding vs Exact Seconds Toggle */}
          <button
            type="button"
            onClick={onToggleSeconds}
            aria-pressed={showAllSeconds}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              showAllSeconds
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {showAllSeconds ? 'Precision: HH:MM:SS' : 'Precision: Alexa Match'}
          </button>

          {/* TV / Echo Show Large Font Toggle */}
          <button
            type="button"
            onClick={onToggleTvMode}
            aria-pressed={tvMode}
            className={`px-3 py-2 text-xs font-medium rounded-lg border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              tvMode
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tvMode ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{tvMode ? 'Standard View' : 'TV / Display Size'}</span>
          </button>

          {/* Copy Schedule Button */}
          <button
            type="button"
            onClick={handleCopyTable}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Neat Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th scope="col" className="py-3.5 px-4 sm:px-5">
                Muhurat / Kala
              </th>
              <th scope="col" className="py-3.5 px-4">
                Classification
              </th>
              <th scope="col" className="py-3.5 px-4">
                Timings ({tzCode})
              </th>
              <th scope="col" className="py-3.5 px-4">
                Duration
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5">
                {isToday ? 'Status & Calculation Rule' : 'Calculation Rule'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredEntries.map((entry) => {
              const status = getLiveStatus(entry, nowMs, isToday);
              const isActive = status === 'active';
              const timeDisplay = formatEntryTimeRange(
                entry,
                panchanga.location.timezone,
                showAllSeconds
              );

              return (
                <tr
                  key={entry.id}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/35'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Name & Sanskrit */}
                  <td className="py-3.5 px-4 sm:px-5 align-top">
                    <div
                      className={`font-semibold text-slate-900 dark:text-slate-100 ${
                        tvMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                      }`}
                    >
                      {entry.name}
                    </div>
                    <div
                      className={`text-slate-500 dark:text-slate-400 mt-0.5 ${
                        tvMode ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {entry.sanskritName}
                    </div>
                  </td>

                  {/* Classification (Text-first, zero pill enclosure) */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`font-medium ${natureTextClass(entry.nature)} ${
                        tvMode ? 'text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {entry.natureLabel}
                    </span>
                  </td>

                  {/* Time Window / Exact Transit */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div
                      className={`font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 ${
                        tvMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                      }`}
                    >
                      {timeDisplay}
                    </div>
                    {entry.crossesMidnight && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Night of {formatShortDate(panchanga.dateStr)} (next calendar morning)
                      </div>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`font-mono tabular-nums text-slate-700 dark:text-slate-300 ${
                        tvMode ? 'text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {entry.isInstant
                        ? 'Exact instant'
                        : formatDuration(entry.endMs - entry.startMs)}
                    </span>
                  </td>

                  {/* Status + Rule */}
                  <td className="py-3.5 px-4 sm:px-5 align-top">
                    {status !== null && (
                      <div
                        className={`font-medium mb-0.5 ${
                          tvMode ? 'text-sm' : 'text-xs'
                        } ${
                          status === 'active'
                            ? 'text-blue-700 dark:text-blue-400'
                            : status === 'upcoming'
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {status === 'active'
                          ? '● Active now'
                          : status === 'upcoming'
                            ? '○ Upcoming'
                            : '✓ Elapsed'}
                      </div>
                    )}
                    <div
                      className={`text-slate-600 dark:text-slate-400 ${
                        tvMode ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {entry.formulaNote}
                    </div>
                    {!tvMode && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 hidden md:block">
                        {entry.description}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
