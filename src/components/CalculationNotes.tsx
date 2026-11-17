import React from 'react';

export const CalculationNotes: React.FC = () => {
  const formulas = [
    {
      name: 'Sunrise & Sunset',
      rule: 'Astral / NOAA apparent horizon (solar depression −0.833°)',
      detail: 'Computes local apparent sunrise for the chosen date and the following morning sunrise for nighttime calculations.',
    },
    {
      name: 'Rahu Kalam',
      rule: '1/8th of Dinamana (Sunset − Sunrise)',
      detail: 'Weekday slot order (Mon → Sun): 2nd, 7th, 5th, 6th, 4th, 3rd, 8th segment of daylight.',
    },
    {
      name: 'Yamaganda',
      rule: '1/8th of Dinamana (Sunset − Sunrise)',
      detail: 'Weekday slot order (Mon → Sun): 4th, 3rd, 2nd, 1st, 7th, 6th, 5th segment of daylight.',
    },
    {
      name: 'Gulika Kalam (Gulige Kaal)',
      rule: '1/8th of Dinamana (Sunset − Sunrise)',
      detail: 'Weekday slot order (Mon → Sun): 6th, 5th, 4th, 3rd, 2nd, 1st, 7th segment of daylight.',
    },
    {
      name: 'Madhyana Kala',
      rule: 'Daylight × 2/5 to Daylight × 3/5',
      detail: 'The 3rd fifth of the interval between local sunrise and local sunset.',
    },
    {
      name: 'Abhijit Muhurta',
      rule: 'Daylight × 7/15 to Daylight × 8/15',
      detail: 'The 8th of 15 equal daylight Muhurtas, centered on apparent solar noon.',
    },
    {
      name: 'Nishita Kala',
      rule: 'Night × 7/15 to Night × 8/15',
      detail: 'The 8th of 15 equal nighttime Muhurtas between today’s sunset and next morning’s sunrise, centered on solar midnight.',
    },
    {
      name: 'Rounding Convention',
      rule: 'Standard Minute Rounding (+30s)',
      detail: 'Interval windows round to the nearest minute (HH:MM); Sunrise, Sunset, Solar Noon, and Solar Midnight display exact seconds (HH:MM:SS).',
    },
  ];

  return (
    <section
      id="calculation-notes"
      aria-label="Astronomical Calculation Reference"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6"
    >
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100">
          Astronomical Methodology
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every interval is computed directly from local solar ephemeris equations (Astral / NOAA apparent horizon depression &amp; rounding logic).
        </p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        {formulas.map((item) => (
          <div
            key={item.name}
            className="pb-3 border-b border-slate-100 dark:border-slate-800/60"
          >
            <dt className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.name}
              </span>
              <span className="font-mono text-xs text-blue-700 dark:text-blue-400">
                {item.rule}
              </span>
            </dt>
            <dd className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
