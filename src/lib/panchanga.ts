/**
 * Drik Panchanga calculations (Tithi, Nakshatra, Paksha, Amanta Masa, Ritu)
 * using Jean Meeus Lunar Ephemeris (Ch. 47), Solar Ephemeris, and
 * Chitrapaksha (Lahiri) Ayanamsha.
 */

import {
  formatTime,
  getLocalTimeParts,
  getLocalYMD,
  parseYMD,
  roundToMinuteMs,
  type GeoLocation,
  type PanchangaEntry,
} from './astral';

export interface TithiInfo {
  index: number; // 0..29 (0-14 Shukla, 15-29 Krishna)
  numberInPaksha: number; // 1..15
  name: string;
  paksha: 'Shukla Paksha' | 'Krishna Paksha';
  pakshaShort: 'Shukla' | 'Krishna';
  endMs: number | null;
  nextName: string;
}

export interface NakshatraInfo {
  index: number; // 0..26
  name: string;
  pada: number; // 1..4
  endMs: number | null;
  nextName: string;
}

export interface MasaRituInfo {
  masaIndex: number; // 0=Chaitra .. 11=Phalguna
  masaName: string;
  purnimantaName: string;
  isAdhika: boolean;
  isNija: boolean;
  rituName: string;
  ayanaName: 'Uttarayana' | 'Dakshinayana';
  shakaYear: number;
  samvatsaraName: string;
}

export interface PanchangaDetails {
  referenceMs: number;
  tithi: TithiInfo;
  nakshatra: NakshatraInfo;
  masaRitu: MasaRituInfo;
}

export const TITHI_NAMES = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Amavasya',
] as const;

export const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

export const MASA_NAMES = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwina',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
] as const;

export const RITU_BY_MASA = [
  'Vasanta Ritu',
  'Vasanta Ritu',
  'Grishma Ritu',
  'Grishma Ritu',
  'Varsha Ritu',
  'Varsha Ritu',
  'Sharad Ritu',
  'Sharad Ritu',
  'Hemanta Ritu',
  'Hemanta Ritu',
  'Shishira Ritu',
  'Shishira Ritu',
] as const;

export const SAMVATSARA_NAMES = [
  'Prabhava',
  'Vibhava',
  'Shukla',
  'Pramodoota',
  'Prajothpatti',
  'Angirasa',
  'Shrimukha',
  'Bhava',
  'Yuva',
  'Dhata',
  'Ishwara',
  'Bahudhanya',
  'Pramathi',
  'Vikrama',
  'Vrisha',
  'Chitrabhanu',
  'Swabhanu',
  'Tarana',
  'Parthiva',
  'Vyaya',
  'Sarvajit',
  'Sarvadhari',
  'Virodhi',
  'Vikriti',
  'Khara',
  'Nandana',
  'Vijaya',
  'Jaya',
  'Manmatha',
  'Durmukhi',
  'Hevilambi',
  'Vilambi',
  'Vikari',
  'Sharvari',
  'Plava',
  'Shubhakrit',
  'Shobhakrit',
  'Krodhi',
  'Vishwavasu',
  'Parabhava',
  'Plavanga',
  'Kilaka',
  'Saumya',
  'Sadharana',
  'Virodhikrit',
  'Paridhavi',
  'Pramadicha',
  'Ananda',
  'Rakshasa',
  'Nala',
  'Pingala',
  'Kalayukti',
  'Siddharthi',
  'Raudri',
  'Durmati',
  'Dundubhi',
  'Rudhirodgari',
  'Raktakshi',
  'Krodhana',
  'Akshaya',
] as const;

const DEG = Math.PI / 180;
const JD_UNIX_EPOCH = 2440587.5; // 1970-01-01T00:00:00Z

function norm360(angle: number): number {
  const m = angle % 360;
  return m < 0 ? m + 360 : m;
}

function jdFromMs(ms: number): number {
  return JD_UNIX_EPOCH + ms / 86_400_000;
}

function jCenturyFromMs(ms: number): number {
  return (jdFromMs(ms) - 2451545.0) / 36525.0;
}

/**
 * Lahiri (Chitrapaksha) Ayanamsha in degrees at instant `ms`.
 * Aligned to Indian Astronomical Ephemeris / Drik Panchanga (23°51'11" at J2000.0).
 */
export function lahiriAyanamsha(ms: number): number {
  const t = jCenturyFromMs(ms);
  return 23.85472 + 1.39697128 * t + 0.0003086 * t * t;
}

/**
 * Sun apparent tropical geocentric ecliptic longitude (degrees 0..360).
 */
export function sunApparentLongitude(ms: number): number {
  const t = jCenturyFromMs(ms);
  const l0 = norm360(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const mRad = m * DEG;
  const c =
    Math.sin(mRad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * mRad) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mRad) * 0.000289;
  const trueLong = l0 + c;
  const omega = 125.04 - 1934.136 * t;
  return norm360(trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG));
}

// Meeus Table 47.A main periodic terms for Moon's longitude [d, m, mp, f, coeff_1e-6_deg]
const LUNAR_LONG_TERMS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 1, 0, 6288774],
  [2, 0, -1, 0, 1274027],
  [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793],
  [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923],
  [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383],
  [2, 0, 0, -2, 15327],
  [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675],
  [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548],
  [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163],
  [1, 1, 0, 0, 4987],
  [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994],
  [4, 0, 0, 0, 3861],
  [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689],
  [2, 0, -1, 2, -2602],
  [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348],
  [2, -2, 0, 0, 2236],
  [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069],
  [2, -2, -1, 0, 2048],
  [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595],
  [4, -1, -1, 0, 1215],
  [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810],
  [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713],
  [2, 2, -1, 0, -700],
  [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596],
  [4, 0, 1, 0, 549],
  [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520],
  [1, 0, -2, 0, -487],
];

/**
 * Moon apparent tropical geocentric ecliptic longitude (degrees 0..360)
 * via Jean Meeus Astronomical Algorithms, Chapter 47.
 */
export function moonApparentLongitude(ms: number): number {
  const t = jCenturyFromMs(ms);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;

  const lp = norm360(
    218.3164477 +
      481267.88123421 * t -
      0.0015786 * t2 +
      t3 / 538841 -
      t4 / 65194000
  );
  const d = norm360(
    297.8501921 +
      445267.1114034 * t -
      0.0018819 * t2 +
      t3 / 545868 -
      t4 / 113065000
  );
  const m = norm360(
    357.5291092 + 35999.0502909 * t - 0.0001536 * t2 + t3 / 24490000
  );
  const mp = norm360(
    134.9633964 +
      477198.8675055 * t +
      0.0087414 * t2 +
      t3 / 69699 -
      t4 / 14712000
  );
  const f = norm360(
    93.272095 +
      483202.0175233 * t -
      0.0036539 * t2 -
      t3 / 3526000 +
      t4 / 863310000
  );

  const a1 = norm360(119.75 + 131.849 * t);
  const a2 = norm360(53.09 + 479264.29 * t);
  const e = 1 - 0.002516 * t - 0.0000074 * t2;
  const e2 = e * e;

  let sumL = 0;
  for (const [cd, cm, cmp, cf, coeff] of LUNAR_LONG_TERMS) {
    const arg = (cd * d + cm * m + cmp * mp + cf * f) * DEG;
    let term = coeff * Math.sin(arg);
    if (Math.abs(cm) === 1) term *= e;
    else if (Math.abs(cm) === 2) term *= e2;
    sumL += term;
  }

  // Additional additive corrections (Venus, Jupiter, Earth flattening)
  sumL +=
    3958 * Math.sin(a1 * DEG) +
    1962 * Math.sin((lp - f) * DEG) +
    318 * Math.sin(a2 * DEG);

  // Nutation in longitude (degrees)
  const omega = 125.04452 - 1934.136261 * t;
  const nutation =
    (-17.2 / 3600) * Math.sin(omega * DEG) -
    (1.32 / 3600) * Math.sin(2 * (280.4665 + 36000.7698 * t) * DEG);

  return norm360(lp + sumL / 1_000_000 + nutation);
}

function moonSiderealLongitude(ms: number): number {
  return norm360(moonApparentLongitude(ms) - lahiriAyanamsha(ms));
}

function sunSiderealLongitude(ms: number): number {
  return norm360(sunApparentLongitude(ms) - lahiriAyanamsha(ms));
}

function sunMoonElongation(ms: number): number {
  return norm360(moonApparentLongitude(ms) - sunApparentLongitude(ms));
}

function signedAngleDiff(a: number, b: number): number {
  let diff = (a - b) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Finds the exact timestamp after `startMs` (within `maxHours`) when `angleFn(ms)`
 * crosses `targetDeg` in the forward direction.
 */
function findForwardCrossing(
  startMs: number,
  targetDeg: number,
  angleFn: (ms: number) => number,
  maxHours: number = 36
): number | null {
  const stepMs = 30 * 60_000; // 30-min coarse bracket
  const steps = Math.ceil((maxHours * 3_600_000) / stepMs);

  let prevMs = startMs;
  let prevDiff = signedAngleDiff(angleFn(prevMs), targetDeg);

  for (let i = 1; i <= steps; i++) {
    const currMs = startMs + i * stepMs;
    const currDiff = signedAngleDiff(angleFn(currMs), targetDeg);

    // Zero crossing from negative to non-negative (forward motion)
    if (prevDiff < 0 && currDiff >= 0 && currDiff - prevDiff < 180) {
      let lo = prevMs;
      let hi = currMs;
      for (let iter = 0; iter < 24; iter++) {
        const mid = (lo + hi) / 2;
        if (signedAngleDiff(angleFn(mid), targetDeg) < 0) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return (lo + hi) / 2;
    }

    prevMs = currMs;
    prevDiff = currDiff;
  }

  return null;
}

/**
 * Finds the New Moon (Amavasya) instant nearest to `approxMs` (within ±20 days).
 */
function findNearestNewMoon(approxMs: number): number {
  // Use bisection around rough coarse steps looking for elongation crossing 0°
  const startSearch = approxMs - 17 * 86_400_000;
  const endSearch = approxMs + 17 * 86_400_000;
  const stepMs = 6 * 3_600_000;

  let bestMs = approxMs;
  let bestDist = Infinity;

  let prevMs = startSearch;
  let prevDiff = signedAngleDiff(sunMoonElongation(prevMs), 0);

  for (let t = startSearch + stepMs; t <= endSearch; t += stepMs) {
    const currDiff = signedAngleDiff(sunMoonElongation(t), 0);
    if (prevDiff < 0 && currDiff >= 0 && currDiff - prevDiff < 180) {
      let lo = prevMs;
      let hi = t;
      for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        if (signedAngleDiff(sunMoonElongation(mid), 0) < 0) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const crossing = (lo + hi) / 2;
      const dist = Math.abs(crossing - approxMs);
      if (dist < bestDist) {
        bestDist = dist;
        bestMs = crossing;
      }
    }
    prevMs = t;
    prevDiff = currDiff;
  }

  return bestMs;
}

function getPreviousAndNextNewMoon(refMs: number): { prevNm: number; nextNm: number } {
  const synodicMonthMs = 29.530588853 * 86_400_000;
  const nm = findNearestNewMoon(refMs);
  if (nm <= refMs) {
    return {
      prevNm: nm,
      nextNm: findNearestNewMoon(nm + synodicMonthMs),
    };
  }
  return {
    prevNm: findNearestNewMoon(nm - synodicMonthMs),
    nextNm: nm,
  };
}

/**
 * Computes full Panchanga details (Tithi, Paksha, Nakshatra, Masa, Ritu)
 * evaluated at `referenceMs` (sunrise for normal dates, or solar noon in polar zones).
 */
export function calculatePanchangaDetails(referenceMs: number): PanchangaDetails {
  // 1. Tithi & Paksha
  const elong = sunMoonElongation(referenceMs);
  const tithiIndex = Math.floor(elong / 12) % 30;
  const paksha: TithiInfo['paksha'] =
    tithiIndex < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const pakshaShort = tithiIndex < 15 ? 'Shukla' : 'Krishna';
  const nextTithiBoundary = ((tithiIndex + 1) * 12) % 360;
  const tithiEndMs = findForwardCrossing(
    referenceMs,
    nextTithiBoundary,
    sunMoonElongation,
    36
  );

  const tithi: TithiInfo = {
    index: tithiIndex,
    numberInPaksha: (tithiIndex % 15) + 1,
    name: TITHI_NAMES[tithiIndex],
    paksha,
    pakshaShort,
    endMs: tithiEndMs,
    nextName: TITHI_NAMES[(tithiIndex + 1) % 30],
  };

  // 2. Nakshatra & Pada
  const moonSid = moonSiderealLongitude(referenceMs);
  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(moonSid / nakSpan) % 27;
  const pada = Math.floor((moonSid % nakSpan) / (nakSpan / 4)) + 1;
  const nextNakBoundary = ((nakIndex + 1) * nakSpan) % 360;
  const nakEndMs = findForwardCrossing(
    referenceMs,
    nextNakBoundary,
    moonSiderealLongitude,
    36
  );

  const nakshatra: NakshatraInfo = {
    index: nakIndex,
    name: NAKSHATRA_NAMES[nakIndex],
    pada,
    endMs: nakEndMs,
    nextName: NAKSHATRA_NAMES[(nakIndex + 1) % 27],
  };

  // 3. Amanta Masa (Karnataka / South India) & Adhika detection
  const { prevNm, nextNm } = getPreviousAndNextNewMoon(referenceMs);
  const rashiAtPrevNm = Math.floor(sunSiderealLongitude(prevNm) / 30) % 12;
  const rashiAtNextNm = Math.floor(sunSiderealLongitude(nextNm) / 30) % 12;

  const isAdhika = rashiAtPrevNm === rashiAtNextNm;
  let isNija = false;

  if (!isAdhika) {
    // Check if the previous lunar month was Adhika (meaning current month is Nija)
    const synodicMonthMs = 29.530588853 * 86_400_000;
    const prevPrevNm = findNearestNewMoon(prevNm - synodicMonthMs);
    const rashiAtPrevPrevNm = Math.floor(sunSiderealLongitude(prevPrevNm) / 30) % 12;
    if (rashiAtPrevPrevNm === rashiAtPrevNm) {
      isNija = true;
    }
  }

  // Month after Amavasya in Mina (11) is Chaitra (0), etc.
  const masaIndex = (rashiAtPrevNm + 1) % 12;
  const baseMasaName = MASA_NAMES[masaIndex];
  const masaName = isAdhika
    ? `Adhika ${baseMasaName}`
    : isNija
      ? `Nija ${baseMasaName}`
      : baseMasaName;
  const purnimantaName = MASA_NAMES[(masaIndex + 1) % 12];
  const rituName = RITU_BY_MASA[masaIndex];

  // Ayana from tropical Sun longitude (270°->90° = Uttarayana, 90°->270° = Dakshinayana)
  const sunTrop = sunApparentLongitude(referenceMs);
  const ayanaName: MasaRituInfo['ayanaName'] =
    sunTrop >= 270 || sunTrop < 90 ? 'Uttarayana' : 'Dakshinayana';

  // Shaka year and 60-year Jovian Samvatsara (new year begins at Chaitra Shukla Pratipada)
  const refDate = new Date(referenceMs);
  const gregYear = refDate.getUTCFullYear();
  const gregMonth = refDate.getUTCMonth() + 1;
  const shakaYear = gregMonth <= 5 && masaIndex >= 9 ? gregYear - 79 : gregYear - 78;
  const samvatsaraIndex = (((shakaYear + 11) % 60) + 60) % 60;
  const samvatsaraName = SAMVATSARA_NAMES[samvatsaraIndex];

  return {
    referenceMs,
    tithi,
    nakshatra,
    masaRitu: {
      masaIndex,
      masaName,
      purnimantaName,
      isAdhika,
      isNija,
      rituName,
      ayanaName,
      shakaYear,
      samvatsaraName,
    },
  };
}

/**
 * Formats an end-time timestamp relative to the selected date (`dateStr`),
 * noting `(Next Day)` if the transition happens after midnight in `timezone`.
 */
export function formatTransitionEnd(
  endMs: number | null,
  dateStr: string,
  timezone: string
): string {
  if (endMs === null) return '';
  const rounded = roundToMinuteMs(endMs);
  const parts = getLocalTimeParts(rounded, timezone);
  const endYMD = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}`;
  const timeStr = formatTime(rounded, timezone);
  return endYMD !== dateStr ? `upto ${timeStr} (next day)` : `upto ${timeStr}`;
}

// ---------- Moonrise & Moonset (Meeus Ch. 15 & Ch. 47) ----------

const LUNAR_LAT_TERMS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565],
  [1, 0, 0, 1, -1491],
  [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410],
];

const LUNAR_DIST_TERMS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 1, 0, -20905355],
  [2, 0, -1, 0, -3699111],
  [2, 0, 0, 0, -2955968],
  [0, 0, 2, 0, -569925],
  [0, 1, 0, 0, 48888],
  [0, 0, 0, 2, -3149],
  [2, 0, -2, 0, 246158],
  [2, -1, -1, 0, -152138],
  [2, 0, 1, 0, -170733],
  [2, -1, 0, 0, -204586],
  [0, 1, -1, 0, -129620],
  [1, 0, 0, 0, 108743],
  [0, 1, 1, 0, 104755],
  [2, 0, 0, -2, 79661],
  [0, 0, 3, 0, -34782],
];

function moonHorizonResidualDeg(
  ms: number,
  latitude: number,
  longitude: number
): number {
  const t = jCenturyFromMs(ms);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;

  const lp = norm360(
    218.3164477 +
      481267.88123421 * t -
      0.0015786 * t2 +
      t3 / 538841 -
      t4 / 65194000
  );
  const d = norm360(
    297.8501921 +
      445267.1114034 * t -
      0.0018819 * t2 +
      t3 / 545868 -
      t4 / 113065000
  );
  const m = norm360(
    357.5291092 + 35999.0502909 * t - 0.0001536 * t2 + t3 / 24490000
  );
  const mp = norm360(
    134.9633964 +
      477198.8675055 * t +
      0.0087414 * t2 +
      t3 / 69699 -
      t4 / 14712000
  );
  const f = norm360(
    93.272095 +
      483202.0175233 * t -
      0.0036539 * t2 -
      t3 / 3526000 +
      t4 / 863310000
  );

  const a1 = norm360(119.75 + 131.849 * t);
  const a2 = norm360(53.09 + 479264.29 * t);
  const a3 = norm360(313.45 + 481266.484 * t);
  const e = 1 - 0.002516 * t - 0.0000074 * t2;
  const e2 = e * e;

  let sumL = 0;
  for (const [cd, cm, cmp, cf, coeff] of LUNAR_LONG_TERMS) {
    const arg = (cd * d + cm * m + cmp * mp + cf * f) * DEG;
    let term = coeff * Math.sin(arg);
    if (Math.abs(cm) === 1) term *= e;
    else if (Math.abs(cm) === 2) term *= e2;
    sumL += term;
  }
  sumL +=
    3958 * Math.sin(a1 * DEG) +
    1962 * Math.sin((lp - f) * DEG) +
    318 * Math.sin(a2 * DEG);

  let sumB = 0;
  for (const [cd, cm, cmp, cf, coeff] of LUNAR_LAT_TERMS) {
    const arg = (cd * d + cm * m + cmp * mp + cf * f) * DEG;
    let term = coeff * Math.sin(arg);
    if (Math.abs(cm) === 1) term *= e;
    else if (Math.abs(cm) === 2) term *= e2;
    sumB += term;
  }
  sumB +=
    -2235 * Math.sin(lp * DEG) +
    382 * Math.sin(a3 * DEG) +
    175 * Math.sin((a1 - f) * DEG) +
    175 * Math.sin((a1 + f) * DEG) +
    127 * Math.sin((lp - mp) * DEG) -
    115 * Math.sin((lp + mp) * DEG);

  let sumR = 0;
  for (const [cd, cm, cmp, cf, coeff] of LUNAR_DIST_TERMS) {
    const arg = (cd * d + cm * m + cmp * mp + cf * f) * DEG;
    let term = coeff * Math.cos(arg);
    if (Math.abs(cm) === 1) term *= e;
    else if (Math.abs(cm) === 2) term *= e2;
    sumR += term;
  }

  // Nutation & true obliquity of the ecliptic
  const omega = 125.04452 - 1934.136261 * t;
  const sunMeanLong = 280.4665 + 36000.7698 * t;
  const deltaPsiDeg =
    (-17.2 / 3600) * Math.sin(omega * DEG) -
    (1.32 / 3600) * Math.sin(2 * sunMeanLong * DEG);
  const deltaEpsDeg =
    (9.2 / 3600) * Math.cos(omega * DEG) +
    (0.57 / 3600) * Math.cos(2 * sunMeanLong * DEG);
  const eps0 = 23 + 26 / 60 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 3600;
  const eps = eps0 + deltaEpsDeg;

  const lambda = norm360(lp + sumL / 1_000_000 + deltaPsiDeg);
  const beta = sumB / 1_000_000;
  const distKm = 385000.56 + sumR / 1000;
  const parallaxDeg = Math.asin(6378.14 / distKm) / DEG;

  // Ecliptic to equatorial coordinates
  const lamR = lambda * DEG;
  const betR = beta * DEG;
  const epsR = eps * DEG;

  const raDeg = norm360(
    Math.atan2(
      Math.sin(lamR) * Math.cos(epsR) - Math.tan(betR) * Math.sin(epsR),
      Math.cos(lamR)
    ) / DEG
  );
  const decRad = Math.asin(
    Math.sin(betR) * Math.cos(epsR) +
      Math.cos(betR) * Math.sin(epsR) * Math.sin(lamR)
  );

  // Greenwich Apparent Sidereal Time -> Local Hour Angle
  const jd = jdFromMs(ms);
  const gmstDeg = norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * t2 -
      t3 / 38710000
  );
  const gastDeg = norm360(gmstDeg + deltaPsiDeg * Math.cos(epsR));
  const localHourAngleDeg = norm360(gastDeg + longitude - raDeg);

  const latR = latitude * DEG;
  const sinAlt =
    Math.sin(latR) * Math.sin(decRad) +
    Math.cos(latR) * Math.cos(decRad) * Math.cos(localHourAngleDeg * DEG);
  const geoAltDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG;

  // Meeus Ch. 15 Moon apparent upper-limb horizon altitude: h0 = 0.7275 * pi - 34'
  const h0 = 0.7275 * parallaxDeg - 34 / 60;
  return geoAltDeg - h0;
}

export interface MoonRiseSetResult {
  moonriseMs: number | null;
  moonsetMs: number | null;
}

/**
 * Calculates local Moonrise and Moonset timestamps occurring on calendar date
 * `dateStr` in `location.timezone`. Returns `null` if the Moon does not rise/set
 * during that 24-hour calendar day.
 */
export function calculateMoonRiseAndSet(
  dateStr: string,
  location: GeoLocation
): MoonRiseSetResult {
  const { year, month, day } = parseYMD(dateStr);
  const baseUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const searchStart = baseUtc - 16 * 3_600_000;
  const searchEnd = baseUtc + 38 * 3_600_000;
  const stepMs = 10 * 60_000;

  let moonriseMs: number | null = null;
  let moonsetMs: number | null = null;

  let prevMs = searchStart;
  let prevVal = moonHorizonResidualDeg(
    prevMs,
    location.latitude,
    location.longitude
  );

  for (let t = searchStart + stepMs; t <= searchEnd; t += stepMs) {
    const currVal = moonHorizonResidualDeg(
      t,
      location.latitude,
      location.longitude
    );

    // Rising crossing
    if (prevVal < 0 && currVal >= 0) {
      let lo = prevMs;
      let hi = t;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (
          moonHorizonResidualDeg(mid, location.latitude, location.longitude) < 0
        ) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const crossing = (lo + hi) / 2;
      if (getLocalYMD(crossing, location.timezone) === dateStr && moonriseMs === null) {
        moonriseMs = crossing;
      }
    }

    // Setting crossing
    if (prevVal >= 0 && currVal < 0) {
      let lo = prevMs;
      let hi = t;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (
          moonHorizonResidualDeg(mid, location.latitude, location.longitude) >= 0
        ) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const crossing = (lo + hi) / 2;
      if (getLocalYMD(crossing, location.timezone) === dateStr && moonsetMs === null) {
        moonsetMs = crossing;
      }
    }

    prevMs = t;
    prevVal = currVal;
  }

  return { moonriseMs, moonsetMs };
}

export function buildLunarEntries(moonRiseSet: MoonRiseSetResult): PanchangaEntry[] {
  const entries: PanchangaEntry[] = [];

  if (moonRiseSet.moonriseMs !== null) {
    entries.push({
      id: 'moonrise',
      name: 'Moonrise',
      sanskritName: 'चन्द्रोदय (Chandrodaya)',
      nature: 'lunar',
      natureLabel: 'Lunar Event',
      isInstant: true,
      startMs: moonRiseSet.moonriseMs,
      endMs: moonRiseSet.moonriseMs,
      crossesMidnight: false,
      formulaNote: 'Lunar upper-limb horizon (0.7275π − 34′)',
      description: 'Local apparent rising of the Moon’s upper limb above the eastern horizon.',
      alexaUsesSeconds: false,
    });
  }

  if (moonRiseSet.moonsetMs !== null) {
    entries.push({
      id: 'moonset',
      name: 'Moonset',
      sanskritName: 'चन्द्रास्त (Chandrastamaya)',
      nature: 'lunar',
      natureLabel: 'Lunar Event',
      isInstant: true,
      startMs: moonRiseSet.moonsetMs,
      endMs: moonRiseSet.moonsetMs,
      crossesMidnight: false,
      formulaNote: 'Lunar upper-limb horizon (0.7275π − 34′)',
      description: 'Local apparent setting of the Moon’s upper limb below the western horizon.',
      alexaUsesSeconds: false,
    });
  }

  return entries;
}

