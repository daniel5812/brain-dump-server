// src/decision/resolveIntent.ts

import {
  resolveDateFromText,
  resolveTimeFromText,
  buildDateTime,
} from "../followup/dateResolver";

import { RawIntent } from "./rawIntentTypes";

type ResolvedIntent =
  | {
      type: "task";
      title: string;
      due?: string;
      confidence: number;
    }
  | {
      type: "meeting";
      title: string;
      start: string;
      end: string;
      confidence: number;
    }
  | {
      type: "idea";
      title: string;
      confidence: number;
    }
  | {
      type: "unclear";
      title: string;
      confidence: number;
      reason: "MISSING_DATE" | "MISSING_TIME" | "MISSING_BOTH";
    };

function addMinutesISO(iso: string, minutesToAdd: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // אם ה-ISO לא תקין, נחזיר כמו שהוא (יסתנכרן ל-unclear בהמשך אם צריך)
    return iso;
  }

  d.setMinutes(d.getMinutes() + minutesToAdd);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
}

export function resolveIntent(raw: RawIntent): ResolvedIntent {
  const title = raw.title ?? "ללא כותרת";
  const confidence = raw.confidence ?? 0;

  const textSource = raw.relativeTime || raw.title || "";

  /* =========================
     IDEA – הכי פשוט
  ========================= */
  if (raw.hypothesis === "idea") {
    return {
      type: "idea",
      title,
      confidence,
    };
  }

  /* =========================
     MEETING – אם ה-LLM כבר סיפק start ISO → לא עושים follow-up
     (בהתאם לפרומפט: הוא אמור לתת ISO רק כשזה נאמר במפורש)
  ========================= */
  if (raw.hypothesis === "meeting" && raw.start) {
    const start = raw.start;
    const end = raw.end ?? addMinutesISO(start, 60);

    return {
      type: "meeting",
      title,
      start,
      end,
      confidence,
    };
  }

  /* =========================
     TASK – אם ה-LLM סיפק due ISO → סומכים עליו
  ========================= */
  if (raw.hypothesis === "task" && raw.due) {
    return {
      type: "task",
      title,
      due: raw.due,
      confidence,
    };
  }

  /* =========================
     DATE + TIME EXTRACTION (מהטקסט, רק אם אין ISO מפורש)
  ========================= */
  const date = resolveDateFromText(textSource);
  const time = resolveTimeFromText(textSource);

  const hasDate = !!date;
  const hasTime = time.hour !== undefined;

  /* =========================
     MEETING – לפי טקסט
  ========================= */
  if (raw.hypothesis === "meeting") {
    if (!hasDate && !hasTime) {
      return {
        type: "unclear",
        title,
        confidence,
        reason: "MISSING_BOTH",
      };
    }

    if (!hasDate) {
      return {
        type: "unclear",
        title,
        confidence,
        reason: "MISSING_DATE",
      };
    }

    if (!hasTime) {
      return {
        type: "unclear",
        title,
        confidence,
        reason: "MISSING_TIME",
      };
    }

    const start = buildDateTime(date!, time);
    if (!start) {
      return {
        type: "unclear",
        title,
        confidence,
        reason: "MISSING_BOTH",
      };
    }

    // end = start + 60 דקות (בטוח יותר מהוספת hour ידנית)
    const end = addMinutesISO(start, 60);

    return {
      type: "meeting",
      title,
      start,
      end,
      confidence,
    };
  }

  /* =========================
     TASK – לפי טקסט
  ========================= */
  if (raw.hypothesis === "task") {
    if (hasDate) {
      // משימה עם תאריך → due סוף היום
      const due = buildDateTime(date!, { hour: 23, minute: 59, confidence: 1 });
      return {
        type: "task",
        title,
        due: due ?? undefined,
        confidence,
      };
    }

    // משימה בלי תאריך – עדיין תקין
    return {
      type: "task",
      title,
      confidence,
    };
  }

  /* =========================
     FALLBACK
  ========================= */
  return {
    type: "unclear",
    title,
    confidence,
    reason: "MISSING_BOTH",
  };
}
