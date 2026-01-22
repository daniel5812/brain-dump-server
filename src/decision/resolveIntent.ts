export type RawIntent = {
  hypothesis: "task" | "meeting" | "idea";
  title: string;

  start?: string | null;
  end?: string | null;
  due?: string | null;
  relativeTime?: string | null;

  confidence: number;
  signals: {
    hasDate: boolean;
    hasTime: boolean;
    hasTimeRange: boolean;
  };
};

export type ResolvedIntent =
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
      reason: "MISSING_TIME" | "MISSING_DATE" | "UNKNOWN_TYPE";
      confidence: number;
    };

export function resolveIntent(raw: RawIntent): ResolvedIntent {
  // ✅ פגישה — רק אם יש תאריך מוחלט וטווח זמן מלא
  if (
    raw.signals.hasTimeRange &&
    raw.signals.hasDate &&
    raw.start &&
    raw.end
  ) {
    return {
      type: "meeting",
      title: raw.title,
      start: raw.start,
      end: raw.end,
      confidence: 1.0,
    };
  }

  // ⏱️ יש טווח זמן אבל אין תאריך → צריך הבהרה
  if (raw.signals.hasTimeRange && !raw.signals.hasDate) {
    return {
      type: "unclear",
      title: raw.title,
      reason: "MISSING_DATE",
      confidence: raw.confidence,
    };
  }

  // ✅ משימה עם תאריך יעד
  if (raw.due && raw.signals.hasDate && !raw.signals.hasTimeRange) {
    return {
      type: "task",
      title: raw.title,
      due: raw.due,
      confidence: raw.confidence,
    };
  }

  // 💡 רעיון
  if (raw.hypothesis === "idea") {
    return {
      type: "idea",
      title: raw.title,
      confidence: raw.confidence,
    };
  }

  // ❓ לא ברור
  return {
    type: "unclear",
    title: raw.title,
    reason: "UNKNOWN_TYPE",
    confidence: raw.confidence,
  };
}
