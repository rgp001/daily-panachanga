import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  COMMON_TIMEZONES,
  PRESET_CITIES,
  QUICK_PRESET_NAMES,
  searchRemoteCities,
  type GeocodingResult,
} from '../data/cities';
import {
  addDaysYMD,
  BENGALURU_PRESET,
  getTodayYMDInTimezone,
  type GeoLocation,
} from '../lib/astral';

interface LocationDateBarProps {
  location: GeoLocation;
  dateStr: string;
  onLocationChange: (loc: GeoLocation) => void;
  onDateChange: (dateStr: string) => void;
}

export const LocationDateBar: React.FC<LocationDateBarProps> = ({
  location,
  dateStr,
  onLocationChange,
  onDateChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<GeocodingResult[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [showCustomCoords, setShowCustomCoords] = useState(false);

  const [latInput, setLatInput] = useState(String(location.latitude));
  const [lonInput, setLonInput] = useState(String(location.longitude));
  const [labelInput, setLabelInput] = useState(location.name);
  const [tzInput, setTzInput] = useState(location.timezone);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLatInput(location.latitude.toFixed(4));
    setLonInput(location.longitude.toFixed(4));
    setLabelInput(location.name);
    setTzInput(location.timezone);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening dropdown
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    }
  }, [dropdownOpen]);

  // Filter local cities
  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PRESET_CITIES;
    return PRESET_CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        (city.region && city.region.toLowerCase().includes(q)) ||
        (city.country && city.country.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Remote Open-Meteo city search when user types >= 2 characters
  useEffect(() => {
    const q = searchQuery.trim();
    if (!dropdownOpen || q.length < 2) {
      setRemoteResults([]);
      setIsSearchingRemote(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const results = await searchRemoteCities(q, controller.signal);
        // Deduplicate against local matches by name + approximate coordinates
        const filtered = results.filter(
          (r) =>
            !localMatches.some(
              (l) =>
                l.name.toLowerCase() === r.name.toLowerCase() &&
                Math.abs(l.latitude - r.latitude) < 0.25 &&
                Math.abs(l.longitude - r.longitude) < 0.25
            )
        );
        setRemoteResults(filtered);
      } catch {
        setRemoteResults([]);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, dropdownOpen, localMatches]);

  const quickPresets = useMemo(
    () =>
      QUICK_PRESET_NAMES.map((name) =>
        PRESET_CITIES.find((c) => c.name === name)
      ).filter((c): c is GeoLocation => Boolean(c)),
    []
  );

  const todayInTz = getTodayYMDInTimezone(location.timezone);
  const isToday = dateStr === todayInTz;

  const handleSelectCity = (city: GeoLocation) => {
    onLocationChange(city);
    setDropdownOpen(false);
    setSearchQuery('');
    setCoordError(null);
    setGeoMessage(null);
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(latInput.trim());
    const lon = Number(lonInput.trim());

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError('Latitude must be between -90 and 90 degrees.');
      return;
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setCoordError('Longitude must be between -180 and 180 degrees.');
      return;
    }

    setCoordError(null);
    setGeoMessage(null);
    onLocationChange({
      name: labelInput.trim() || 'Custom Coordinates',
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      timezone: tzInput,
    });
  };

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoMessage('Geolocation is not supported in this browser.');
      return;
    }
    setGeoMessage('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const browserTz =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setGeoMessage(null);
        setCoordError(null);
        onLocationChange({
          name: 'Current Location',
          latitude: lat,
          longitude: lon,
          timezone: browserTz,
        });
      },
      () => {
        setGeoMessage('Location permission denied. Enter coordinates manually.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const availableTimezones = useMemo(() => {
    const set = new Set(COMMON_TIMEZONES);
    if (tzInput) set.add(tzInput);
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz) set.add(browserTz);
    return Array.from(set);
  }, [tzInput]);

  return (
    <section
      aria-label="Location and date controls"
      className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* City Search Combobox */}
        <div className="lg:col-span-5 relative" ref={dropdownRef}>
          <label
            htmlFor="city-combobox-trigger"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
          >
            City or Location
          </label>
          <button
            id="city-combobox-trigger"
            type="button"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg flex items-center justify-between gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="truncate font-medium text-slate-900 dark:text-slate-100 text-sm">
                {location.name}
                {location.region ? `, ${location.region}` : ''}
                {location.country && location.country !== 'India'
                  ? ` · ${location.country}`
                  : ''}
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-40 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any city (e.g. Bengaluru, Varanasi, London)..."
                  aria-label="Search cities"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div
                role="listbox"
                aria-label="Cities"
                className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70"
              >
                {localMatches.map((city) => {
                  const isSelected =
                    city.name === location.name &&
                    Math.abs(city.latitude - location.latitude) < 0.01 &&
                    Math.abs(city.longitude - location.longitude) < 0.01;
                  return (
                    <button
                      key={`local-${city.name}-${city.latitude}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCity(city)}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {city.name}
                          {city.name === 'Bengaluru' && (
                            <span className="ml-2 text-xs font-normal text-blue-700 dark:text-blue-400">
                              Default Preset
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[city.region, city.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                      </span>
                    </button>
                  );
                })}

                {isSearchingRemote && (
                  <div className="px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                    Searching worldwide directory...
                  </div>
                )}

                {!isSearchingRemote && remoteResults.length > 0 && (
                  <>
                    <div className="px-3.5 py-1.5 text-[11px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-950">
                      Worldwide Directory Matches
                    </div>
                    {remoteResults.map((city, idx) => (
                      <button
                        key={`remote-${city.name}-${city.latitude}-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => handleSelectCity(city)}
                        className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {city.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {[city.region, city.country].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 shrink-0">
                          {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {localMatches.length === 0 &&
                  !isSearchingRemote &&
                  remoteResults.length === 0 && (
                    <div className="px-3.5 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No matching city found. Use Custom Coordinates to enter exact latitude and longitude.
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Date Picker & Day Steppers */}
        <div className="lg:col-span-5">
          <label
            htmlFor="panchanga-date-input"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
          >
            Date
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onDateChange(addDaysYMD(dateStr, -1))}
              aria-label="Previous day"
              className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1 min-w-0">
              <Calendar className="w-4 h-4 text-slate-400 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="panchanga-date-input"
                type="date"
                value={dateStr}
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value);
                }}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={() => onDateChange(addDaysYMD(dateStr, 1))}
              aria-label="Next day"
              className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDateChange(todayInTz)}
              disabled={isToday}
              className={`min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isToday
                  ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                  : 'bg-blue-700 hover:bg-blue-800 border-blue-700 text-white'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Coordinates Toggle */}
        <div className="lg:col-span-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowCustomCoords((v) => !v)}
            aria-expanded={showCustomCoords}
            className={`w-full min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              showCustomCoords
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Lat / Lon</span>
          </button>
        </div>
      </div>

      {/* Quick Presets Row */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
            Presets:
          </span>
          {quickPresets.map((city) => {
            const active =
              city.name === location.name &&
              Math.abs(city.latitude - location.latitude) < 0.01;
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => handleSelectCity(city)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>Use my GPS coordinates</span>
        </button>
      </div>

      {geoMessage && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {geoMessage}
        </p>
      )}

      {/* Custom Latitude / Longitude & Timezone Panel */}
      {showCustomCoords && (
        <form
          onSubmit={handleApplyCustomCoords}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              <Compass className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Custom Coordinates &amp; Timezone</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectCity(BENGALURU_PRESET)}
              className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              Restore Bengaluru (12.9716° N, 77.5946° E)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-3">
              <label
                htmlFor="custom-label"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                Location Label
              </label>
              <input
                id="custom-label"
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Home Temple"
                className="w-full min-h-[40px] px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="custom-lat"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                Latitude (°N / −°S)
              </label>
              <input
                id="custom-lat"
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="custom-lon"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                Longitude (°E / −°W)
              </label>
              <input
                id="custom-lon"
                type="number"
                step="any"
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="custom-tz"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                Timezone
              </label>
              <select
                id="custom-tz"
                value={tzInput}
                onChange={(e) => setTzInput(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {availableTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz === 'Asia/Kolkata' ? 'Asia/Kolkata (IST)' : tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full min-h-[40px] px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Calculate
              </button>
            </div>
          </div>

          {coordError && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
              {coordError}
            </p>
          )}
        </form>
      )}
    </section>
  );
};
