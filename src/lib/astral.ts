/**
 * Astronomical solar & Panchanga calculations ported directly from the Python
 * `astral==3.2` NOAA/Meeus equations and the `rahu_kalam.py` Alexa skill logic.
 */

export interface GeoLocation {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type TimingNature = 'auspicious' | 'inauspicious' | 'neutral' | 'solar';

export interface PanchangaEntry {
  id: string;
  name: string;
  sanskritName: string;
  nature: TimingNature;
  natureLabel: string;
  isInstant: boolean;
  startMs: number;
  endMs: number;
  /** True when the event ends on the next local calendar day (e.g. Nishita Kala, Solar Midnight). */
  crossesMidnight: boolean;
  /** Exact rule used for calculation (mirrors rahu_kalam.py). */
  formulaNote: string;
  /** Short human description of significance. */
  description: string;
  /** Whether Alexa skill rounds this to nearest minute or formats with seconds. */
  alexaUsesSeconds: boolean;
}

export interface DailyPanchanga {
  dateStr: string; // YYYY-MM-DD
  weekdayIndex: number; // 0 = Monday .. 6 = Sunday (matches Python date.weekday())
  weekdayName: string;
  varaName: string;
  location: GeoLocation;
  sunriseMs: number | null;
  sunsetMs: number | null;
  nextSunriseMs: number | null;
  solarNoonMs: number | null;
  solarMidnightMs: number | null;
  daylightDurationMs: number | null;
  nightDurationMs: number | null;
  polarCondition: 'normal' | 'polar_day' | 'polar_night';
  entries: PanchangaEntry[];
}

export const BENGALURU_PRESET: GeoLocation = {
  name: 'Bengaluru',
  region: 'Karnataka',
  country: 'India',
  latitude: 12.9716,
  longitude: 77.5946,
  timezone: 'Asia/Kolkata',
};

// Python weekday numbering: Monday=0 through Sunday=6
export const RAHU_PERIOD_BY_WEEKDAY: Record<number, number> = {
  0: 2, // Monday
  1: 7, // Tuesday
  2: 5, // Wednesday
  3: 6, // Thursday
  4: 4, // Friday
  5: 3, // Saturday
  6: 8, // Sunday
};

export const YAMAGANDA_PERIOD_BY_WEEKDAY: Record<number, number> = {
  0: 4, // Monday
  1: 3, // Tuesday
  2: 2, // Wednesday
  3: 1, // Thursday
  4: 7, // Friday
  5: 6, // Saturday
  6: 5, // Sunday
};

// Standard Vedic / South Indian Gulika Kalam (Gulige Kaal) 1/8th daylight slot
export const GULIKA_PERIOD_BY_WEEKDAY: Record<number, number> = {
  0: 6, // Monday
  1: 5, // Tuesday
  2: 4, // Wednesday
  3: 3, // Thursday
  4: 2, // Friday
  5: 1, // Saturday
  6: 7, // Sunday
};

const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const VARA_NAMES = [
  'Somavara',
  'Mangalavara',
  'Budhavara',
  'Guruvara',
  'Shukravara',
  'Shanivara',
  'Ravivara',
];

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
// Astral 3.2 solar depression at sea-level horizon:
// apparent radius (16' = 0.266667°) + atmospheric refraction (34' = 0.566667°)
const SUN_ZENITH_HORIZON = 90 + 50 / 60; // 90.83333333333333°

function rad(deg: number): number {
  return deg * DEG_TO_RAD;
}

function deg(r: number): number {
  return r * RAD_TO_DEG;
}

function julianDayFromYMD(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  );
}

function jdayToJcentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

function geomMeanLongSun(t: number): number {
  const l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360.0;
  return l0 < 0 ? l0 + 360.0 : l0;
}

function geomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function eccentEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function sunEqOfCenter(t: number): number {
  const m = geomMeanAnomalySun(t);
  const mrad = rad(m);
  const sinm = Math.sin(mrad);
  const sin2m = Math.sin(2 * mrad);
  const sin3m = Math.sin(3 * mrad);
  return (
    sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sin2m * (0.019993 - 0.000101 * t) +
    sin3m * 0.000289
  );
}

function sunTrueLong(t: number): number {
  return geomMeanLongSun(t) + sunEqOfCenter(t);
}

function sunApparentLong(t: number): number {
  const o = sunTrueLong(t);
  const omega = 125.04 - 1934.136 * t;
  return o - 0.00569 - 0.00478 * Math.sin(rad(omega));
}

function meanObliqEcliptic(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23.0 + (26.0 + seconds / 60.0) / 60.0;
}

function obliqCorr(t: number): number {
  const e0 = meanObliqEcliptic(t);
  const omega = 125.04 - 1934.136 * t;
  return e0 + 0.00256 * Math.cos(rad(omega));
}

function sunDeclination(t: number): number {
  const e = obliqCorr(t);
  const lambd = sunApparentLong(t);
  const sint = Math.sin(rad(e)) * Math.sin(rad(lambd));
  return deg(Math.asin(sint));
}

function eqOfTime(t: number): number {
  const epsilon = obliqCorr(t);
  const l0 = geomMeanLongSun(t);
  const e = eccentEarthOrbit(t);
  const m = geomMeanAnomalySun(t);

  let y = Math.tan(rad(epsilon) / 2.0);
  y *= y;

  const sin2l0 = Math.sin(2.0 * rad(l0));
  const sinm = Math.sin(rad(m));
  const cos2l0 = Math.cos(2.0 * rad(l0));
  const sin4l0 = Math.sin(4.0 * rad(l0));
  const sin2m = Math.sin(2.0 * rad(m));

  const etime =
    y * sin2l0 -
    2.0 * e * sinm +
    4.0 * e * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * e * e * sin2m;

  return deg(etime) * 4.0; // in minutes
}

function hourAngleSunrise(
  lat: number,
  solarDec: number,
  zenith: number
): number | null {
  const latRad = rad(lat);
  const sdRad = rad(solarDec);
  const cosHA =
    Math.cos(rad(zenith)) / (Math.cos(latRad) * Math.cos(sdRad)) -
    Math.tan(latRad) * Math.tan(sdRad);

  if (cosHA > 1 || cosHA < -1) {
    return null; // Sun never rises or never sets
  }
  return deg(Math.acos(cosHA));
}

function calcNoonUtcMsForUtcDate(
  utcDateMs: number,
  longitude: number
): number {
  const d = new Date(utcDateMs);
  const jd = julianDayFromYMD(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate()
  );

  const tNoon = jdayToJcentury(jd - longitude / 360.0);
  const eqTime = eqOfTime(tNoon);
  const solNoonOffset = 720.0 - longitude * 4.0 - eqTime;

  const newt = jdayToJcentury(jd + solNoonOffset / 1440.0);
  const eqTime2 = eqOfTime(newt);
  const solNoonMinutes = 720.0 - longitude * 4.0 - eqTime2;

  return utcDateMs + solNoonMinutes * 60_000;
}

function calcMidnightUtcMsForUtcDate(
  utcDateMs: number,
  longitude: number
): number {
  const d = new Date(utcDateMs);
  const jd = julianDayFromYMD(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate()
  );

  const tMid = jdayToJcentury(jd - longitude / 360.0);
  const eqTime = eqOfTime(tMid);
  const solMidOffset = -(longitude * 4.0) - eqTime;

  const newt = jdayToJcentury(jd + solMidOffset / 1440.0);
  const eqTime2 = eqOfTime(newt);
  const solMidMinutes = -(longitude * 4.0) - eqTime2;

  return utcDateMs + solMidMinutes * 60_000;
}

function calcSunriseOrSunsetUtcMsForUtcDate(
  utcDateMs: number,
  latitude: number,
  longitude: number,
  isSunrise: boolean
): number | null {
  const d = new Date(utcDateMs);
  const jd = julianDayFromYMD(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate()
  );

  // Pass 1
  const t = jdayToJcentury(jd - longitude / 360.0);
  const eqTime = eqOfTime(t);
  const solarDec = sunDeclination(t);
  const ha = hourAngleSunrise(latitude, solarDec, SUN_ZENITH_HORIZON);
  if (ha === null) return null;

  const delta = isSunrise ? longitude + ha : longitude - ha;
  const timeMin = 720.0 - 4.0 * delta - eqTime;

  // Pass 2
  const t2 = jdayToJcentury(jd + timeMin / 1440.0);
  const eqTime2 = eqOfTime(t2);
  const solarDec2 = sunDeclination(t2);
  const ha2 = hourAngleSunrise(latitude, solarDec2, SUN_ZENITH_HORIZON);
  if (ha2 === null) return null;

  const delta2 = isSunrise ? longitude + ha2 : longitude - ha2;
  const timeMin2 = 720.0 - 4.0 * delta2 - eqTime2;

  return utcDateMs + timeMin2 * 60_000;
}

// ---------- Timezone & Date Helpers ----------

export function parseYMD(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function addDaysYMD(dateStr: string, deltaDays: number): string {
  const { year, month, day } = parseYMD(dateStr);
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns Python-compatible weekday index: Monday=0 .. Sunday=6 */
export function getWeekdayIndex(dateStr: string): number {
  const { year, month, day } = parseYMD(dateStr);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7;
}

export function getTodayYMDInTimezone(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function getLocalYMD(ms: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ms));

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function getLocalTimeParts(
  ms: number,
  timezone: string
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));

  const getNum = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');

  return {
    year: getNum('year'),
    month: getNum('month'),
    day: getNum('day'),
    hour: getNum('hour') % 24,
    minute: getNum('minute'),
    second: getNum('second'),
  };
}

/**
 * Equivalent to `round_to_minute` in `rahu_kalam.py`:
 * `(value + timedelta(seconds=30)).replace(second=0, microsecond=0)`
 */
export function roundToMinuteMs(ms: number): number {
  return Math.floor((ms + 30_000) / 60_000) * 60_000;
}

/**
 * Equivalent to `format_time` in `rahu_kalam.py`: `h:mm AM/PM`
 */
export function formatTime(ms: number, timezone: string): string {
  const { hour, minute } = getLocalTimeParts(ms, timezone);
  const h12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/**
 * Equivalent to `format_time_with_seconds` in `rahu_kalam.py`:
 * rounds to nearest second (`+500ms`) and formats `h:mm:ss AM/PM`.
 */
export function formatTimeWithSeconds(ms: number, timezone: string): string {
  const roundedSecMs = Math.floor((ms + 500) / 1000) * 1000;
  const { hour, minute, second } = getLocalTimeParts(roundedSecMs, timezone);
  const h12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${suffix}`;
}

export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatShortDate(dateStr: string): string {
  const { year, month, day } = parseYMD(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function getTimezoneOffsetLabel(timezone: string, dateStr?: string): string {
  try {
    const refDate = dateStr
      ? new Date(`${dateStr}T12:00:00Z`)
      : new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(refDate);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (timezone === 'Asia/Kolkata') return 'IST (UTC+5:30)';
    return tzName ? `${timezone} (${tzName})` : timezone;
  } catch {
    return timezone;
  }
}

export function getTimezoneShortCode(timezone: string, dateStr?: string): string {
  if (timezone === 'Asia/Kolkata') return 'IST';
  try {
    const refDate = dateStr
      ? new Date(`${dateStr}T12:00:00Z`)
      : new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(refDate);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timezone;
  } catch {
    return timezone;
  }
}

/**
 * Resolves the exact UTC timestamp for a solar event matching the target local
 * calendar date `targetDateStr` in `timezone`, handling any longitude/timezone cleanly.
 */
function resolveEventForLocalDate(
  targetDateStr: string,
  timezone: string,
  calculator: (utcDateMs: number) => number | null
): number | null {
  const { year, month, day } = parseYMD(targetDateStr);
  const baseUtc = Date.UTC(year, month - 1, day, 0, 0, 0);

  for (const offsetDays of [0, -1, 1, -2, 2]) {
    const candidate = calculator(baseUtc + offsetDays * 86_400_000);
    if (candidate !== null && getLocalYMD(candidate, timezone) === targetDateStr) {
      return candidate;
    }
  }
  return null;
}

/**
 * Calculates the full daily Panchanga & Muhurat schedule for a date and location,
 * reproducing the exact calculations of `rahu_kalam.py`.
 */
export function calculateDailyPanchanga(
  dateStr: string,
  location: GeoLocation
): DailyPanchanga {
  const { latitude, longitude, timezone } = location;
  const weekdayIndex = getWeekdayIndex(dateStr);
  const weekdayName = WEEKDAY_NAMES[weekdayIndex];
  const varaName = VARA_NAMES[weekdayIndex];
  const nextDateStr = addDaysYMD(dateStr, 1);

  const sunriseMs = resolveEventForLocalDate(dateStr, timezone, (utcMs) =>
    calcSunriseOrSunsetUtcMsForUtcDate(utcMs, latitude, longitude, true)
  );
  const sunsetMs = resolveEventForLocalDate(dateStr, timezone, (utcMs) =>
    calcSunriseOrSunsetUtcMsForUtcDate(utcMs, latitude, longitude, false)
  );
  const nextSunriseMs = resolveEventForLocalDate(nextDateStr, timezone, (utcMs) =>
    calcSunriseOrSunsetUtcMsForUtcDate(utcMs, latitude, longitude, true)
  );
  const solarNoonMs = resolveEventForLocalDate(dateStr, timezone, (utcMs) =>
    calcNoonUtcMsForUtcDate(utcMs, longitude)
  );

  // Solar midnight for the night beginning on `dateStr` (matches astral midnight(day + 1))
  let solarMidnightMs: number | null = null;
  if (sunsetMs !== null) {
    const { year, month, day } = parseYMD(nextDateStr);
    const nextBaseUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
    const candidates = [-1, 0, 1, 2].map((d) =>
      calcMidnightUtcMsForUtcDate(nextBaseUtc + d * 86_400_000, longitude)
    );
    // Pick the solar midnight occurring after today's sunset (typically within 4-9 hours)
    const afterSunset = candidates
      .filter((c) => c > sunsetMs && c < sunsetMs + 16 * 3_600_000)
      .sort((a, b) => a - b);
    solarMidnightMs = afterSunset[0] ?? null;
  }

  let polarCondition: DailyPanchanga['polarCondition'] = 'normal';
  if (sunriseMs === null || sunsetMs === null) {
    // Check declination at noon to distinguish polar day vs polar night
    const { year, month, day } = parseYMD(dateStr);
    const jd = julianDayFromYMD(year, month, day);
    const dec = sunDeclination(jdayToJcentury(jd));
    polarCondition = dec * latitude >= 0 ? 'polar_day' : 'polar_night';
  }

  const entries: PanchangaEntry[] = [];

  if (sunriseMs !== null && sunsetMs !== null && sunsetMs > sunriseMs) {
    const daylight = sunsetMs - sunriseMs;
    const eighth = daylight / 8;

    // 1. Brahma Muhurta (96 min to 48 min before sunrise, standard 2 muhurtas prior to dawn)
    entries.push({
      id: 'brahma-muhurta',
      name: 'Brahma Muhurta',
      sanskritName: 'ब्रह्म मुहूर्त',
      nature: 'auspicious',
      natureLabel: 'Auspicious',
      isInstant: false,
      startMs: sunriseMs - 96 * 60_000,
      endMs: sunriseMs - 48 * 60_000,
      crossesMidnight: false,
      formulaNote: 'Sunrise − 96m to Sunrise − 48m',
      description: 'Pre-dawn contemplative window ideal for meditation, study, and prayer.',
      alexaUsesSeconds: false,
    });

    // 2. Sunrise
    entries.push({
      id: 'sunrise',
      name: 'Sunrise',
      sanskritName: 'सूर्योदय (Suryodaya)',
      nature: 'solar',
      natureLabel: 'Solar Event',
      isInstant: true,
      startMs: sunriseMs,
      endMs: sunriseMs,
      crossesMidnight: false,
      formulaNote: 'Solar upper-limb depression −0.833°',
      description: 'Local apparent sunrise; begins the Vedic daytime (Dinamana) and Vara.',
      alexaUsesSeconds: true,
    });

    // 3. Rahu Kalam (exact rahu_kalam.py formula)
    const rahuPeriod = RAHU_PERIOD_BY_WEEKDAY[weekdayIndex];
    const rahuStart = sunriseMs + eighth * (rahuPeriod - 1);
    const rahuEnd = rahuStart + eighth;
    entries.push({
      id: 'rahu-kalam',
      name: 'Rahu Kalam',
      sanskritName: 'राहु काल',
      nature: 'inauspicious',
      natureLabel: 'Inauspicious',
      isInstant: false,
      startMs: rahuStart,
      endMs: rahuEnd,
      crossesMidnight: false,
      formulaNote: `Daylight slot ${rahuPeriod}/8 (${weekdayName})`,
      description: 'Daily planetary segment to avoid initiating new auspicious undertakings.',
      alexaUsesSeconds: false,
    });

    // 4. Yamaganda (exact rahu_kalam.py formula)
    const yamaPeriod = YAMAGANDA_PERIOD_BY_WEEKDAY[weekdayIndex];
    const yamaStart = sunriseMs + eighth * (yamaPeriod - 1);
    const yamaEnd = yamaStart + eighth;
    entries.push({
      id: 'yamaganda',
      name: 'Yamaganda',
      sanskritName: 'यमगण्ड',
      nature: 'inauspicious',
      natureLabel: 'Inauspicious',
      isInstant: false,
      startMs: yamaStart,
      endMs: yamaEnd,
      crossesMidnight: false,
      formulaNote: `Daylight slot ${yamaPeriod}/8 (${weekdayName})`,
      description: 'Inauspicious daytime segment governed by Yama; avoided for major journeys or starts.',
      alexaUsesSeconds: false,
    });

    // 5. Gulika Kalam (Gulige Kaal)
    const gulikaPeriod = GULIKA_PERIOD_BY_WEEKDAY[weekdayIndex];
    const gulikaStart = sunriseMs + eighth * (gulikaPeriod - 1);
    const gulikaEnd = gulikaStart + eighth;
    entries.push({
      id: 'gulika-kalam',
      name: 'Gulika Kalam (Gulige Kaal)',
      sanskritName: 'गुलिक काल',
      nature: 'inauspicious',
      natureLabel: 'Inauspicious',
      isInstant: false,
      startMs: gulikaStart,
      endMs: gulikaEnd,
      crossesMidnight: false,
      formulaNote: `Daylight slot ${gulikaPeriod}/8 (${weekdayName})`,
      description: 'Saturn-ruled segment; traditionally considered inauspicious for new beginnings.',
      alexaUsesSeconds: false,
    });

    // 6. Madhyana Kala (exact rahu_kalam.py formula: 3rd fifth of daylight)
    const madhyanaStart = sunriseMs + daylight * (2 / 5);
    const madhyanaEnd = sunriseMs + daylight * (3 / 5);
    entries.push({
      id: 'madhyana-kala',
      name: 'Madhyana Kala',
      sanskritName: 'मध्याह्न काल',
      nature: 'neutral',
      natureLabel: 'Midday Window',
      isInstant: false,
      startMs: madhyanaStart,
      endMs: madhyanaEnd,
      crossesMidnight: false,
      formulaNote: 'Daylight 2/5 to 3/5 (3rd fifth)',
      description: 'Midday fifth of daylight used for Madhyahnika rituals and Pitru tarpanam.',
      alexaUsesSeconds: false,
    });

    // 7. Abhijit Muhurta (exact rahu_kalam.py formula: 8th of 15 daylight muhurtas)
    const abhijitStart = sunriseMs + daylight * (7 / 15);
    const abhijitEnd = sunriseMs + daylight * (8 / 15);
    entries.push({
      id: 'abhijit-muhurta',
      name: 'Abhijit Muhurta',
      sanskritName: 'अभिजित् मुहूर्त',
      nature: 'auspicious',
      natureLabel: 'Auspicious',
      isInstant: false,
      startMs: abhijitStart,
      endMs: abhijitEnd,
      crossesMidnight: false,
      formulaNote: 'Daylight 7/15 to 8/15 (8th Muhurta)',
      description: 'Highly auspicious midday muhurta centered around solar noon.',
      alexaUsesSeconds: false,
    });

    // 8. Solar Noon
    if (solarNoonMs !== null) {
      entries.push({
        id: 'solar-noon',
        name: 'Solar Noon',
        sanskritName: 'मध्याह्न (Madhyahna)',
        nature: 'solar',
        natureLabel: 'Solar Transit',
        isInstant: true,
        startMs: solarNoonMs,
        endMs: solarNoonMs,
        crossesMidnight: false,
        formulaNote: 'Upper meridian transit',
        description: 'Exact instant when the Sun reaches its highest daily altitude.',
        alexaUsesSeconds: true,
      });
    }

    // 9. Sunset
    entries.push({
      id: 'sunset',
      name: 'Sunset',
      sanskritName: 'सूर्यास्त (Suryastamaya)',
      nature: 'solar',
      natureLabel: 'Solar Event',
      isInstant: true,
      startMs: sunsetMs,
      endMs: sunsetMs,
      crossesMidnight: false,
      formulaNote: 'Solar upper-limb depression −0.833°',
      description: 'Local apparent sunset; marks the beginning of Ratrimana (nighttime).',
      alexaUsesSeconds: true,
    });

    // 10. Nishita Kala (exact rahu_kalam.py formula: 8th of 15 night muhurtas)
    if (nextSunriseMs !== null && nextSunriseMs > sunsetMs) {
      const night = nextSunriseMs - sunsetMs;
      const nishitaStart = sunsetMs + night * (7 / 15);
      const nishitaEnd = sunsetMs + night * (8 / 15);
      entries.push({
        id: 'nishita-kala',
        name: 'Nishita Kala (Nishita Muhurat)',
        sanskritName: 'निशीथ काल',
        nature: 'auspicious',
        natureLabel: 'Auspicious',
        isInstant: false,
        startMs: nishitaStart,
        endMs: nishitaEnd,
        crossesMidnight: getLocalYMD(nishitaEnd, timezone) !== dateStr,
        formulaNote: 'Night 7/15 to 8/15 (8th Night Muhurta)',
        description: 'Sacred midnight muhurta centered around apparent solar midnight.',
        alexaUsesSeconds: false,
      });
    }

    // 11. Solar Midnight
    if (solarMidnightMs !== null) {
      entries.push({
        id: 'solar-midnight',
        name: 'Solar Midnight',
        sanskritName: 'अर्धरात्रि (Ardharatri)',
        nature: 'solar',
        natureLabel: 'Solar Transit',
        isInstant: true,
        startMs: solarMidnightMs,
        endMs: solarMidnightMs,
        crossesMidnight: getLocalYMD(solarMidnightMs, timezone) !== dateStr,
        formulaNote: 'Lower meridian transit',
        description: 'Exact instant of apparent solar midnight for the night beginning today.',
        alexaUsesSeconds: true,
      });
    }

    // Sort chronologically by start time
    entries.sort((a, b) => a.startMs - b.startMs);
  }

  return {
    dateStr,
    weekdayIndex,
    weekdayName,
    varaName,
    location,
    sunriseMs,
    sunsetMs,
    nextSunriseMs,
    solarNoonMs,
    solarMidnightMs,
    daylightDurationMs:
      sunriseMs !== null && sunsetMs !== null ? sunsetMs - sunriseMs : null,
    nightDurationMs:
      sunsetMs !== null && nextSunriseMs !== null ? nextSunriseMs - sunsetMs : null,
    polarCondition,
    entries,
  };
}

/**
 * Formats an entry's time or interval using either Alexa-matched rounding
 * or full second-level precision.
 */
export function formatEntryTimeRange(
  entry: PanchangaEntry,
  timezone: string,
  showAllSeconds: boolean = false
): string {
  if (entry.isInstant) {
    return showAllSeconds || entry.alexaUsesSeconds
      ? formatTimeWithSeconds(entry.startMs, timezone)
      : formatTime(roundToMinuteMs(entry.startMs), timezone);
  }

  if (showAllSeconds) {
    return `${formatTimeWithSeconds(entry.startMs, timezone)} – ${formatTimeWithSeconds(entry.endMs, timezone)}`;
  }

  const startRounded = roundToMinuteMs(entry.startMs);
  const endRounded = roundToMinuteMs(entry.endMs);
  return `${formatTime(startRounded, timezone)} – ${formatTime(endRounded, timezone)}`;
}
