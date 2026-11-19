import React from 'react';
import {
  formatTransitionEnd,
  type PanchangaDetails,
} from '../lib/panchanga';

interface PanchangaElementsStripProps {
  details: PanchangaDetails | null;
  dateStr: string;
  weekdayName: string;
  varaName: string;
  timezone: string;
  nextSunriseMs: number | null;
  tvMode: boolean;
}

export const PanchangaElementsStrip: React.FC<PanchangaElementsStripProps> = ({
  details,
  dateStr,
  weekdayName,
  varaName,
  timezone,
  nextSunriseMs,
  tvMode,
}) => {
  if (!details) return null;

  const { tithi, nakshatra, masaRitu } = details;

  const tithiEndsBeforeNextSunrise =
    tithi.endMs !== null &&
    nextSunriseMs !== null &&
    tithi.endMs < nextSunriseMs;

  const nakEndsBeforeNextSunrise =
    nakshatra.endMs !== null &&
    nextSunriseMs !== null &&
    nakshatra.endMs < nextSunriseMs;

  const tithiSubtext = tithi.endMs
    ? `${formatTransitionEnd(tithi.endMs, dateStr, timezone)}${
        tithiEndsBeforeNextSunrise ? ` · then ${tithi.nextName}` : ''
      }`
    : 'Full day';

  const nakSubtext = nakshatra.endMs
    ? `Pada ${nakshatra.pada} · ${formatTransitionEnd(
        nakshatra.endMs,
        dateStr,
        timezone
      )}${nakEndsBeforeNextSunrise ? ` · then ${nakshatra.nextName}` : ''}`
    : `Pada ${nakshatra.pada}`;

  const valueClass = tvMode
    ? 'text-xl sm:text-2xl'
    : 'text-lg';
  const subClass = tvMode ? 'text-sm' : 'text-xs';

  return (
    <section
      aria-label="Daily Panchanga Elements"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:grid-flow-row">
        {/* 1. Samvatsara */}
        <div className="p-4 sm:border-b border-slate-200 dark:border-slate-800 sm:border-r">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Samvatsara
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {masaRitu.samvatsaraName}
          </div>
          <div className={`mt-1 text-slate-600 dark:text-slate-400 font-mono tabular-nums ${subClass}`}>
            Shaka Samvat {masaRitu.shakaYear}
          </div>
        </div>

        {/* 2. Ayana & Ritu */}
        <div className="p-4 sm:border-b border-slate-200 dark:border-slate-800 lg:border-r">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ayana · Ritu
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {masaRitu.ayanaName}
          </div>
          <div className={`mt-1 text-slate-600 dark:text-slate-400 ${subClass}`}>
            {masaRitu.rituName}
          </div>
        </div>

        {/* 3. Masa & Paksha */}
        <div className="p-4 sm:border-b border-slate-200 dark:border-slate-800 sm:border-r lg:border-r-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Masa · Paksha
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {masaRitu.masaName} Masa
          </div>
          <div className={`mt-1 text-slate-600 dark:text-slate-400 ${subClass}`}>
            <span>{tithi.paksha}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Amanta</span>
            {tithi.paksha === 'Krishna Paksha' && !masaRitu.isAdhika && (
              <>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Purnimanta: {masaRitu.purnimantaName}</span>
              </>
            )}
          </div>
        </div>

        {/* 4. Day of the Week (Vara) */}
        <div className="p-4 sm:border-b lg:border-b-0 border-slate-200 dark:border-slate-800 lg:border-r">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Day of the Week (Vara)
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {weekdayName}
          </div>
          <div className={`mt-1 text-slate-600 dark:text-slate-400 ${subClass}`}>
            {varaName}
          </div>
        </div>

        {/* 5. Tithi */}
        <div className="p-4 sm:border-r border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tithi (at Sunrise)
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {tithi.name}
          </div>
          <div
            className={`mt-1 text-slate-600 dark:text-slate-400 font-mono tabular-nums ${subClass}`}
          >
            {tithiSubtext}
          </div>
        </div>

        {/* 6. Nakshatra */}
        <div className="p-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Nakshatra (at Sunrise)
          </div>
          <div
            className={`mt-1 font-serif font-semibold text-slate-900 dark:text-slate-100 ${valueClass}`}
          >
            {nakshatra.name}
          </div>
          <div
            className={`mt-1 text-slate-600 dark:text-slate-400 font-mono tabular-nums ${subClass}`}
          >
            {nakSubtext}
          </div>
        </div>
      </div>
    </section>
  );
};
