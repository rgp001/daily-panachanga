import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { CalculationNotes } from './components/CalculationNotes';
import { DayArcStrip } from './components/DayArcStrip';
import { LocationDateBar } from './components/LocationDateBar';
import { PanchangaElementsStrip } from './components/PanchangaElementsStrip';
import { PanchangaTable } from './components/PanchangaTable';
import { WeeklyOutlookTable } from './components/WeeklyOutlookTable';
import { PRESET_CITIES } from './data/cities';
import {
  buildLunarEntries,
  calculateMoonRiseAndSet,
  calculatePanchangaDetails,
} from './lib/panchanga';
import {
  BENGALURU_PRESET,
  calculateDailyPanchanga,
  formatShortDate,
  formatTimeWithSeconds,
  getTimezoneOffsetLabel,
  getTodayYMDInTimezone,
  type GeoLocation,
} from './lib/astral';

type ActiveView = 'daily' | 'weekly';

function getInitialLocation(): GeoLocation {
  if (typeof window === 'undefined') return BENGALURU_PRESET;
  const params = new URLSearchParams(window.location.search);
  const latParam = params.get('lat');
  const lonParam = params.get('lon');
  const tzParam = params.get('tz');
  const nameParam = params.get('name');
  const cityParam = params.get('city');

  if (latParam !== null && lonParam !== null) {
    const lat = Number(latParam);
    const lon = Number(lonParam);
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        name: nameParam || 'Custom Location',
        latitude: lat,
        longitude: lon,
        timezone: tzParam || 'Asia/Kolkata',
      };
    }
  }

  if (cityParam) {
    const found = PRESET_CITIES.find(
      (c) => c.name.toLowerCase() === cityParam.trim().toLowerCase()
    );
    if (found) return found;
  }

  try {
    const saved = localStorage.getItem('panchanga_location');
    if (saved) {
      const parsed = JSON.parse(saved) as GeoLocation;
      if (
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.timezone === 'string' &&
        typeof parsed.name === 'string'
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }

  return BENGALURU_PRESET;
}

function getInitialDate(tz: string): string {
  if (typeof window !== 'undefined') {
    const dateParam = new URLSearchParams(window.location.search).get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
  }
  return getTodayYMDInTimezone(tz);
}

export default function App() {
  const [location, setLocation] = useState<GeoLocation>(() => getInitialLocation());
  const [dateStr, setDateStr] = useState<string>(() =>
    getInitialDate(getInitialLocation().timezone)
  );
  const [activeView, setActiveView] = useState<ActiveView>('daily');
  const [tvMode, setTvMode] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('panchanga_theme') === 'dark';
  });

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('panchanga_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  // Persist selected location
  useEffect(() => {
    try {
      localStorage.setItem('panchanga_location', JSON.stringify(location));
    } catch {
      // Ignore storage errors
    }
  }, [location]);

  // Live clock tick every second for the header clock
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const basePanchanga = useMemo(
    () => calculateDailyPanchanga(dateStr, location),
    [dateStr, location]
  );

  const moonRiseSet = useMemo(
    () => calculateMoonRiseAndSet(dateStr, location),
    [dateStr, location]
  );

  const panchanga = useMemo(() => {
    const lunarEntries = buildLunarEntries(moonRiseSet);
    const mergedEntries = [...basePanchanga.entries, ...lunarEntries].sort(
      (a, b) => a.startMs - b.startMs
    );
    return {
      ...basePanchanga,
      entries: mergedEntries,
    };
  }, [basePanchanga, moonRiseSet]);

  const panchangaDetails = useMemo(() => {
    const refMs = panchanga.sunriseMs ?? panchanga.solarNoonMs;
    return refMs !== null ? calculatePanchangaDetails(refMs) : null;
  }, [panchanga.sunriseMs, panchanga.solarNoonMs]);

  const todayInTz = getTodayYMDInTimezone(location.timezone);
  const isToday = dateStr === todayInTz;

  const isBengaluru =
    location.name === BENGALURU_PRESET.name &&
    Math.abs(location.latitude - BENGALURU_PRESET.latitude) < 0.001 &&
    Math.abs(location.longitude - BENGALURU_PRESET.longitude) < 0.001;

  const handleResetBengaluru = () => {
    setLocation(BENGALURU_PRESET);
    setDateStr(getTodayYMDInTimezone(BENGALURU_PRESET.timezone));
    setActiveView('daily');
  };

  const handleLocationChange = (nextLoc: GeoLocation) => {
    const prevToday = getTodayYMDInTimezone(location.timezone);
    setLocation(nextLoc);
    // Keep "today" synced if the user was viewing today and switched timezone
    if (dateStr === prevToday) {
      setDateStr(getTodayYMDInTimezone(nextLoc.timezone));
    }
  };

  const latLabel = `${Math.abs(location.latitude).toFixed(4)}° ${
    location.latitude >= 0 ? 'N' : 'S'
  }`;
  const lonLabel = `${Math.abs(location.longitude).toFixed(4)}° ${
    location.longitude >= 0 ? 'E' : 'W'
  }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar: Strictly 3 zones separated by gap-8 */}
      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('daily');
            }}
            className="font-serif text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            Home Panchanga
          </a>

          {/* Zone 2: Clean single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveView('daily')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'daily'
                  ? 'text-blue-700 dark:text-blue-400 underline underline-offset-4'
                  : ''
              }`}
            >
              Daily Table
            </button>
            <button
              type="button"
              onClick={() => setActiveView('weekly')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'weekly'
                  ? 'text-blue-700 dark:text-blue-400 underline underline-offset-4'
                  : ''
              }`}
            >
              7-Day Outlook
            </button>
            <a
              href="#calculation-notes"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Methodology
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Print
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleResetBengaluru}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isBengaluru && isToday ? 'Bengaluru Today' : 'Bengaluru Preset'}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Editorial Almanac Title + Utility Switch */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                {[location.name, location.region, location.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {latLabel}, {lonLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {getTimezoneOffsetLabel(location.timezone, dateStr)}
              </span>
            </div>
            <h1 className="mt-1.5 font-serif text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              {location.name} Panchanga &amp; Nishita Muhurat
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {panchanga.weekdayName} ({panchanga.varaName}) ·{' '}
              <span className="font-mono tabular-nums">
                {formatShortDate(dateStr)}
              </span>{' '}
              · Local clock{' '}
              <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                {formatTimeWithSeconds(nowMs, location.timezone)}
              </span>
            </p>
          </div>

          {/* Workspace View & Theme Controls */}
          <div className="no-print flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveView('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Daily Table
              </button>
              <button
                type="button"
                onClick={() => setActiveView('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                7-Day Outlook
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Location Search, Coordinates & Date Picker */}
        <LocationDateBar
          location={location}
          dateStr={dateStr}
          onLocationChange={handleLocationChange}
          onDateChange={setDateStr}
        />

        {/* Daily Panchanga Elements: Samvatsara, Ayana, Ritu, Masa, Paksha, Vara, Tithi, Nakshatra */}
        <PanchangaElementsStrip
          details={panchangaDetails}
          dateStr={dateStr}
          weekdayName={panchanga.weekdayName}
          varaName={panchanga.varaName}
          timezone={location.timezone}
          nextSunriseMs={panchanga.nextSunriseMs}
          tvMode={tvMode}
        />

        {/* Key Summary Cards + Solar Timeline */}
        <DayArcStrip
          panchanga={panchanga}
          moonRiseSet={moonRiseSet}
          nowMs={nowMs}
          isToday={isToday}
        />

        {/* Primary Tabular Display */}
        {activeView === 'daily' ? (
          <PanchangaTable
            panchanga={panchanga}
            nowMs={nowMs}
            isToday={isToday}
            tvMode={tvMode}
            onToggleTvMode={() => setTvMode((t) => !t)}
          />
        ) : (
          <WeeklyOutlookTable
            startDateStr={dateStr}
            location={location}
            onSelectDate={(chosenDate) => {
              setDateStr(chosenDate);
              setActiveView('daily');
            }}
          />
        )}

        {/* Astronomical Rules Reference */}
        <CalculationNotes />
      </main>

      <footer className="no-print border-t border-slate-200 dark:border-slate-800 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Home Panchanga · Ephemeris calculations computed locally in your browser
          </span>
          <span className="font-mono tabular-nums">
            Default Preset: Bengaluru (12.9716° N, 77.5946° E · IST)
          </span>
        </div>
      </footer>
    </div>
  );
}
