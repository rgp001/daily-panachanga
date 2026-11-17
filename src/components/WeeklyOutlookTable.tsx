import React, { useMemo } from 'react';
import {
  addDaysYMD,
  calculateDailyPanchanga,
  formatEntryTimeRange,
  formatShortDate,
  formatTime,
  getTimezoneShortCode,
  roundToMinuteMs,
  type GeoLocation,
} from '../lib/astral';

interface WeeklyOutlookTableProps {
  startDateStr: string;
  location: GeoLocation;
  onSelectDate: (dateStr: string) => void;
}

export const WeeklyOutlookTable: React.FC<WeeklyOutlookTableProps> = ({
  startDateStr,
  location,
  onSelectDate,
}) => {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dStr = addDaysYMD(startDateStr, i);
      return calculateDailyPanchanga(dStr, location);
    });
  }, [startDateStr, location]);

  const tzCode = getTimezoneShortCode(location.timezone, startDateStr);

  const findTime = (
    p: ReturnType<typeof calculateDailyPanchanga>,
    id: string
  ) => {
    const entry = p.entries.find((e) => e.id === id);
    if (!entry) return '—';
    return formatEntryTimeRange(entry, location.timezone);
  };

  return (
    <section
      aria-label="7-Day Panchanga Outlook"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
            7-Day Muhurat &amp; Kala Outlook
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {location.name} · Starting {formatShortDate(startDateStr)} · Times in {tzCode}. Click any row to open its full daily table.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th scope="col" className="py-3 px-4">Date</th>
              <th scope="col" className="py-3 px-3">Sunrise / Sunset</th>
              <th scope="col" className="py-3 px-3 text-rose-700 dark:text-rose-400">Rahu Kalam</th>
              <th scope="col" className="py-3 px-3 text-rose-700 dark:text-rose-400">Yamaganda</th>
              <th scope="col" className="py-3 px-3 text-rose-700 dark:text-rose-400">Gulika</th>
              <th scope="col" className="py-3 px-3 text-emerald-700 dark:text-emerald-400">Abhijit</th>
              <th scope="col" className="py-3 px-3 text-amber-700 dark:text-amber-400">Madhyana</th>
              <th scope="col" className="py-3 px-4 text-blue-700 dark:text-blue-400">Nishita Kala</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
            {days.map((day) => {
              const isSelected = day.dateStr === startDateStr;
              return (
                <tr
                  key={day.dateStr}
                  onClick={() => onSelectDate(day.dateStr)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/35'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {day.weekdayName.slice(0, 3)}, {formatShortDate(day.dateStr)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {day.varaName}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {day.sunriseMs !== null && day.sunsetMs !== null
                      ? `${formatTime(roundToMinuteMs(day.sunriseMs), location.timezone)} / ${formatTime(roundToMinuteMs(day.sunsetMs), location.timezone)}`
                      : 'Polar'}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-slate-900 dark:text-slate-100">
                    {findTime(day, 'rahu-kalam')}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-slate-800 dark:text-slate-200">
                    {findTime(day, 'yamaganda')}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-slate-800 dark:text-slate-200">
                    {findTime(day, 'gulika-kalam')}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400">
                    {findTime(day, 'abhijit-muhurta')}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-slate-800 dark:text-slate-200">
                    {findTime(day, 'madhyana-kala')}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap font-medium text-blue-700 dark:text-blue-400">
                    {findTime(day, 'nishita-kala')}
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
