// src/followup/dateResolver.ts

/* =========================================================
   VOICE-FIRST DATE/TIME RESOLVER (Hebrew)
   - tolerant to speech noise and different word orders
   - returns partial or full results
========================================================= */

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

// דקות בעברית (למקרים כמו "עשר דקות לשבע")
const HEBREW_MINUTES: Record<string, number> = {
  "חמש": 5,
  "עשר": 10,
  "רבע": 15,
  "עשרים": 20,
  "עשרים וחמש": 25,
  "עשריםוחמש": 25,
  "חצי": 30,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalize(raw: string) {
  // ניקוי "רעש" של דיבור, ושמירה על מספרים/נקודות/נקודתיים
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
   DATE
========================= */

export function resolveDateFromText(text: string, now = new Date()): Date | null {
  const clean = normalize(text)
    .replace(/\bביום\b/g, "")
    .replace(/\bהקרוב\b/g, "")
    .replace(/\bהבא\b/g, "")
    .trim();

  // 1) יחסי בסיס
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

  // 2) "עוד X ימים" / "בעוד X ימים"
  // תומך: "עוד 3 ימים", "בעוד 2 ימים"
  const inDays = clean.match(/(?:עוד|בעוד)\s*(\d{1,2})\s*ימים/);
  if (inDays) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + Number(inDays[1]));
    return d;
  }

  // 3) "עוד שבוע/שבועיים"
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

  // 4) יום בשבוע
  for (const [name, dayIndex] of Object.entries(DAYS_MAP)) {
    // מאפשר: "ראשון", "יום ראשון", "ביום ראשון"
    if (clean.includes(name)) {
      return nextWeekday(dayIndex, now);
    }
  }

  // 5) תאריך מספרי: dd/mm או dd.mm או dd-mm
  // כולל 2026-01-12
  const fullIso = clean.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (fullIso) {
    const y = Number(fullIso[1]);
    const m = Number(fullIso[2]) - 1;
    const d = Number(fullIso[3]);
    const dt = new Date(y, m, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  const numeric = clean.match(/\b(\d{1,2})[\/\.-](\d{1,2})\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = now.getFullYear();

    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);

    // אם כבר עבר → שנה הבאה
    if (d < startOfDay(now)) d.setFullYear(year + 1);
    return d;
  }

  // 6) "הראשון לינואר" / "1 בינואר"
  // יום בחודש יכול להגיע בספרות
  const dayNum = clean.match(/\b(\d{1,2})\b/);
  let dayOfMonth: number | null = dayNum ? Number(dayNum[1]) : null;

  // או במילים נפוצות ("הראשון", "השני"...)
  const ordinal = clean.match(/\b(ה?ראשון|ה?שני|ה?שלישי|ה?רביעי|ה?חמישי|ה?שישי|ה?שביעי|ה?שמיני|ה?תשיעי|ה?עשירי)\b/);
  if (!dayOfMonth && ordinal) {
    const map: Record<string, number> = {
      "ראשון": 1, "הראשון": 1,
      "שני": 2, "השני": 2,
      "שלישי": 3, "השלישי": 3,
      "רביעי": 4, "הרביעי": 4,
      "חמישי": 5, "החמישי": 5,
      "שישי": 6, "השישי": 6,
      "שביעי": 7, "השביעי": 7,
      "שמיני": 8, "השמיני": 8,
      "תשיעי": 9, "התשיעי": 9,
      "עשירי": 10, "העשירי": 10,
    };
    dayOfMonth = map[ordinal[1].replace("ה", "")] ?? map[ordinal[1]] ?? null;
  }

  // חודש בעברית
  let month: number | null = null;
  for (const [name, index] of Object.entries(HEBREW_MONTHS)) {
    if (clean.includes(name)) {
      month = index;
      break;
    }
  }

  // "לראשון" → ינואר
  if (month === null && clean.includes("לראשון")) {
    month = 0;
  }

  if (dayOfMonth && month !== null) {
    const year = now.getFullYear();
    const d = new Date(year, month, dayOfMonth);
    d.setHours(0, 0, 0, 0);

    if (d < startOfDay(now)) d.setFullYear(year + 1);
    return d;
  }

  return null;
}

/* =========================
   TIME
========================= */

export function resolveTimeFromText(text: string): {
  hour?: number;
  minute?: number;
  confidence: number;
} {
  const lower = text.toLowerCase();

  let hour: number | undefined;
  let minute = 0;
  let confidence = 0;

  /**
   * =========================
   * GUARD – מניעת ניחוש שגוי
   * =========================
   * אם יש תאריך מספרי (1.2 / 1.2.26 / 01-02-2026)
   * ואין שום אינדיקציה מילולית לשעה → לא מפרשים שעה
   */
  const hasNumericDate =
    /\b\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?\b/.test(lower);

  const hasTimeClues =
    // שעה בפורמט קלאסי
    lower.includes(":") ||

    // מילים מפורשות
    lower.includes("שעה") ||
    lower.includes("בשעה") ||

    // חלקי יום
    lower.includes("בבוקר") ||
    lower.includes("בערב") ||
    lower.includes("בצהריים") ||
    lower.includes("בלילה") ||

    // חלקי שעה
    lower.includes("וחצי") ||
    lower.includes("ורבע") ||
    lower.includes("רבע ל") ||

    // 🔑 "באחת / בשש / בשתיים" וכו׳
    /\bב(אחת|אחד|שתיים|שניים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחת עשרה|שתים עשרה)\b/.test(
      lower
    );

  if (hasNumericDate && !hasTimeClues) {
    return { confidence: 0 };
  }

  /**
   * =========================
   * 1️⃣ שעה בספרות (12, 18, 7 וכו׳)
   * =========================
   */
  for (let i = 0; i <= 23; i++) {
    const regex = new RegExp(`\\b${i}\\b`);
    if (regex.test(lower)) {
      hour = i;
      confidence = 0.9;
      break;
    }
  }

  /**
   * =========================
   * 2️⃣ שעה במילים (אחת, שתיים, שש…)
   * =========================
   */
  if (hour === undefined) {
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
      "שתים עשרה": 12,
    };

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

  /**
   * =========================
   * 3️⃣ חלקי שעה
   * =========================
   */
  if (lower.includes("וחצי")) {
    minute = 30;
  } else if (lower.includes("ורבע")) {
    minute = 15;
  } else if (lower.includes("רבע ל")) {
    hour = (hour + 23) % 24;
    minute = 45;
  }

  /**
   * =========================
   * 4️⃣ התאמת חלקי יום
   * =========================
   */
  if (
    (lower.includes("בערב") ||
      lower.includes("בלילה") ||
      lower.includes("בצהריים")) &&
    hour < 12
  ) {
    hour += 12;
  }

  if (lower.includes("בבוקר") && hour === 12) {
    hour = 0;
  }

  return { hour, minute, confidence };
}


/* =========================
   COMBINE
========================= */

export function buildDateTime(
  date: Date,
  time: { hour?: number; minute?: number; confidence?: number }
): string | null {
  if (time.hour === undefined) return null;

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(time.hour)}:${pad(time.minute ?? 0)}:00`
  );
}

/**
 * Convenience: parse both from one string (voice-friendly)
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
