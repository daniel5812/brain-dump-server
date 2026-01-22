// src/followup/dateResolver.ts

/* =========================================================
   VOICE-FIRST DATE/TIME RESOLVER (Hebrew)
   - tolerant to speech noise and different word orders
   - returns partial or full results
========================================================= */

/* ---------- MAPPINGS ---------- */

const DAYS_MAP: Record<string, number> = {
  "ראשון": 0,
  "שני": 1,
  "שלישי": 2,
  "רביעי": 3,
  "חמישי": 4,
  "שישי": 5,
  "שבת": 6,
};

const HEBREW_MONTHS: Record<string, number> = {
  "ינואר": 0,
  "פברואר": 1,
  "מרץ": 2,
  "אפריל": 3,
  "מאי": 4,
  "יוני": 5,
  "יולי": 6,
  "אוגוסט": 7,
  "ספטמבר": 8,
  "אוקטובר": 9,
  "נובמבר": 10,
  "דצמבר": 11,
};

const HEBREW_HOURS: Record<string, number> = {
  "אחת": 1,
  "אחד": 1,
  "שתיים": 2,
  "שניים": 2,
  "שלוש": 3,
  "ארבע": 4,
  "חמש": 5,
  "שש": 6,
  "שבע": 7,
  "שמונה": 8,
  "תשע": 9,
  "עשר": 10,
  "אחת עשרה": 11,
  "אחתעשרה": 11,
  "שתים עשרה": 12,
  "שתיםעשרה": 12,
  "שתיים עשרה": 12,
  "שתייםעשרה": 12,
};

/** Hebrew ordinal numbers for day of month (1-31) */
const HEBREW_DAY_ORDINALS: Record<string, number> = {
  "ראשון": 1, "הראשון": 1, "אחד": 1, "אחת": 1,
  "שני": 2, "השני": 2, "שניים": 2, "שתיים": 2,
  "שלישי": 3, "השלישי": 3, "שלושה": 3, "שלוש": 3,
  "רביעי": 4, "הרביעי": 4, "ארבעה": 4, "ארבע": 4,
  "חמישי": 5, "החמישי": 5, "חמישה": 5, "חמש": 5,
  "שישי": 6, "השישי": 6, "שישה": 6, "שש": 6,
  "שביעי": 7, "השביעי": 7, "שבעה": 7, "שבע": 7,
  "שמיני": 8, "השמיני": 8, "שמונה": 8,
  "תשיעי": 9, "התשיעי": 9, "תשעה": 9, "תשע": 9,
  "עשירי": 10, "העשירי": 10, "עשרה": 10, "עשר": 10,
  "אחד עשר": 11, "אחת עשרה": 11,
  "שנים עשר": 12, "שתים עשרה": 12,
  "שלושה עשר": 13, "שלוש עשרה": 13,
  "ארבעה עשר": 14, "ארבע עשרה": 14,
  "חמישה עשר": 15, "חמש עשרה": 15,
  "שישה עשר": 16, "שש עשרה": 16,
  "שבעה עשר": 17, "שבע עשרה": 17,
  "שמונה עשר": 18, "שמונה עשרה": 18,
  "תשעה עשר": 19, "תשע עשרה": 19,
  "עשרים": 20,
  "עשרים ואחד": 21, "עשרים ואחת": 21,
  "עשרים ושניים": 22, "עשרים ושתיים": 22,
  "עשרים ושלושה": 23, "עשרים ושלוש": 23,
  "עשרים וארבעה": 24, "עשרים וארבע": 24,
  "עשרים וחמישה": 25, "עשרים וחמש": 25,
  "עשרים ושישה": 26, "עשרים ושש": 26,
  "עשרים ושבעה": 27, "עשרים ושבע": 27,
  "עשרים ושמונה": 28,
  "עשרים ותשעה": 29, "עשרים ותשע": 29,
  "שלושים": 30,
  "שלושים ואחד": 31, "שלושים ואחת": 31,
};

/* ---------- HELPERS ---------- */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Normalizes text for voice-first parsing
 * Cleans speech noise while preserving numbers/dots/colons
 */
function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[\u0591-\u05c7]/g, "") // ניקוד
    .replace(/[,\u05be]/g, " ")      // פסיק/מקף עברי
    .replace(/\s+/g, " ")
    .trim();
}

function nextWeekday(targetDay: number, from = new Date()) {
  const date = startOfDay(from);
  const currentDay = date.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  date.setDate(date.getDate() + diff);
  return date;
}

/* =========================
   DATE PARSING
========================= */

/**
 * Resolves a date from free Hebrew/numeric text (voice-friendly)
 * 
 * Supports:
 * - Relative: היום, מחר, מחרתיים, עוד X ימים, שבוע הבא
 * - Weekdays: ביום ראשון, שלישי, etc.
 * - Numeric: 1.2, 1/2, 1-2, 1.2.26, 1.2.2026, 2026-01-12
 * - Hebrew: הראשון לינואר, 15 בפברואר, חמישה במרץ
 */
export function resolveDateFromText(text: string, now = new Date()): Date | null {
  const clean = normalize(text)
    .replace(/\bביום\b/g, "")
    .replace(/\bהקרוב\b/g, "")
    .replace(/\bהבא\b/g, "")
    .trim();

  /* =========================
     1. RELATIVE DATES
  ========================= */
  if (clean.includes("היום")) return startOfDay(now);

  if (clean.includes("מחרתיים")) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + 2);
    return d;
  }

  if (clean.includes("מחר")) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // "עוד X ימים" / "בעוד X ימים"
  const inDays = clean.match(/(?:עוד|בעוד)\s*(\d{1,2})\s*ימים/);
  if (inDays) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + Number(inDays[1]));
    return d;
  }

  // "עוד שבוע/שבועיים"
  if (clean.includes("עוד שבועיים") || clean.includes("בעוד שבועיים")) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + 14);
    return d;
  }
  if (clean.includes("עוד שבוע") || clean.includes("בעוד שבוע") || clean.includes("שבוע הבא")) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + 7);
    return d;
  }

  /* =========================
     2. ISO FORMAT (2026-01-12)
  ========================= */
  const fullIso = clean.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (fullIso) {
    const y = Number(fullIso[1]);
    const m = Number(fullIso[2]) - 1;
    const day = Number(fullIso[3]);
    const dt = new Date(y, m, day);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  /* =========================
     3. NUMERIC DATES (dd/mm, dd.mm, dd-mm, dd/mm/yy, dd.mm.yyyy)
  ========================= */
  const numericWithYear = clean.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
  if (numericWithYear) {
    const day = Number(numericWithYear[1]);
    const month = Number(numericWithYear[2]) - 1;
    let year = Number(numericWithYear[3]);

    // Two-digit year → expand to full year
    if (year < 100) year = 2000 + year;

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  const numericNoYear = clean.match(/\b(\d{1,2})[\/\.-](\d{1,2})\b/);
  if (numericNoYear) {
    const day = Number(numericNoYear[1]);
    const month = Number(numericNoYear[2]) - 1;
    const year = now.getFullYear();

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);

      // If date already passed this year → use next year
      if (d < startOfDay(now)) d.setFullYear(year + 1);
      return d;
    }
  }

  /* =========================
     4. HEBREW MONTH + DAY (הראשון לינואר, 15 בפברואר)
  ========================= */
  // Check if text contains a Hebrew month name
  let foundMonth: number | null = null;
  for (const [monthName, monthIndex] of Object.entries(HEBREW_MONTHS)) {
    if (clean.includes(monthName)) {
      foundMonth = monthIndex;
      break;
    }
  }

  if (foundMonth !== null) {
    // Try to find day as number first
    const dayNumMatch = clean.match(/\b(\d{1,2})\b/);
    let dayOfMonth: number | null = dayNumMatch ? Number(dayNumMatch[1]) : null;

    // Try Hebrew ordinal day
    if (!dayOfMonth) {
      for (const [ordinal, dayNum] of Object.entries(HEBREW_DAY_ORDINALS)) {
        if (clean.includes(ordinal)) {
          dayOfMonth = dayNum;
          break;
        }
      }
    }

    if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const year = now.getFullYear();
      const d = new Date(year, foundMonth, dayOfMonth);
      d.setHours(0, 0, 0, 0);

      // If date already passed this year → use next year
      if (d < startOfDay(now)) d.setFullYear(year + 1);
      return d;
    }
  }

  /* =========================
     5. WEEKDAY NAMES (only if no month context)
  ========================= */
  // Avoid "ראשון" ambiguity — if no month, it means Sunday
  if (foundMonth === null) {
    for (const [name, dayIndex] of Object.entries(DAYS_MAP)) {
      if (clean.includes(name)) {
        return nextWeekday(dayIndex, now);
      }
    }
  }

  return null;
}

/* =========================
   TIME PARSING
========================= */

/**
 * Resolves time from free Hebrew text (voice-friendly)
 * 
 * Includes guard to prevent false positives when numeric date exists
 */
export function resolveTimeFromText(text: string): {
  hour?: number;
  minute?: number;
  confidence: number;
} {
  const lower = text.toLowerCase();

  let hour: number | undefined;
  let minute = 0;
  let confidence = 0;

  /* =========================
     GUARD – prevent false hour detection from dates
  ========================= */
  const hasNumericDate =
    /\b\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?\b/.test(lower);

  const hasTimeClues =
    lower.includes(":") ||
    lower.includes("שעה") ||
    lower.includes("בשעה") ||
    lower.includes("בבוקר") ||
    lower.includes("בערב") ||
    lower.includes("בצהריים") ||
    lower.includes("בלילה") ||
    lower.includes("וחצי") ||
    lower.includes("ורבע") ||
    lower.includes("רבע ל") ||
    // "באחת / בשש / בשתיים" etc.
    /\bב(אחת|אחד|שתיים|שניים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחת עשרה|שתים עשרה)\b/.test(lower);

  // If we have a numeric date but no time clues, don't parse time
  if (hasNumericDate && !hasTimeClues) {
    return { confidence: 0 };
  }

  /* =========================
     1. NUMERIC TIME (HH:MM or just number)
  ========================= */
  const colonMatch = lower.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    hour = Number(colonMatch[1]);
    minute = Number(colonMatch[2]);
    confidence = 0.95;
  }

  // Standalone number as hour (only if time clues present)
  if (hour === undefined && hasTimeClues) {
    const numMatch = lower.match(/\b(\d{1,2})\b/);
    if (numMatch) {
      const n = Number(numMatch[1]);
      if (n >= 0 && n <= 23) {
        hour = n;
        confidence = 0.9;
      }
    }
  }

  /* =========================
     2. HEBREW HOUR WORDS (אחת, שתיים, שש…)
  ========================= */
  if (hour === undefined) {
    for (const [word, value] of Object.entries(HEBREW_HOURS)) {
      if (lower.includes(word)) {
        hour = value;
        confidence = 0.9;
        break;
      }
    }
  }

  if (hour === undefined) {
    return { confidence: 0 };
  }

  /* =========================
     3. PARTS OF HOUR (חצי, רבע)
  ========================= */
  if (lower.includes("וחצי")) {
    minute = 30;
  } else if (lower.includes("ורבע")) {
    minute = 15;
  } else if (lower.includes("רבע ל")) {
    hour = (hour + 23) % 24;
    minute = 45;
  }

  /* =========================
     4. TIME OF DAY ADJUSTMENT
  ========================= */
  if ((lower.includes("בערב") || lower.includes("בלילה") || lower.includes("בצהריים")) && hour < 12) {
    hour += 12;
  }

  if (lower.includes("בבוקר") && hour === 12) {
    hour = 0;
  }

  return { hour, minute, confidence };
}

/* =========================
   COMBINE DATE + TIME
========================= */

/**
 * Combines Date + Time into ISO string
 * Returns null if time is incomplete
 */
export function buildDateTime(
  date: Date,
  time: { hour?: number; minute?: number; confidence?: number }
): string | null {
  if (time.hour === undefined) return null;

  const d = new Date(date);
  d.setHours(time.hour, time.minute ?? 0, 0, 0);

  return d.toISOString();
}

/**
 * Convenience: parse both date and time from one string (voice-friendly)
 */
export function resolveDateTimeFromText(
  text: string,
  now = new Date()
): {
  date: Date | null;
  time: { hour?: number; minute?: number; confidence: number };
  iso: string | null;
} {
  const date = resolveDateFromText(text, now);
  const time = resolveTimeFromText(text);

  if (!date) return { date, time, iso: null };
  const iso = buildDateTime(date, time);

  return { date, time, iso };
}