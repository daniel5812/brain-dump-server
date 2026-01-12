// src/followup/dateResolver.ts

const DAYS_MAP: Record<string, number> = {
  "ראשון": 0,
  "שני": 1,
  "שלישי": 2,
  "רביעי": 3,
  "חמישי": 4,
  "שישי": 5,
  "שבת": 6,
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextWeekday(targetDay: number, from = new Date()) {
  const date = startOfDay(from);
  const currentDay = date.getDay();
  let diff = targetDay - currentDay;

  if (diff <= 0) diff += 7; // הבא, לא היום

  date.setDate(date.getDate() + diff);
  return date;
}

export function resolveDateFromText(text: string, now = new Date()): Date | null {
  const clean = text.replace("ביום", "").trim();

  // היום
  if (clean.includes("היום")) {
    return startOfDay(now);
  }

  // מחר / מחרתיים
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

  // יום בשבוע
  for (const [name, dayIndex] of Object.entries(DAYS_MAP)) {
    if (clean.includes(name)) {
      return nextWeekday(dayIndex, now);
    }
  }

  return null;
}
