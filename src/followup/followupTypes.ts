// src/followup/followupTypes.ts

/* =========================
   Missing fields
========================= */

export type MissingField =
  | "DATE"
  | "TIME"
  | "DATE_TIME_RANGE";

/* =========================
   Time structure
========================= */

export interface TimeOfDay {
  hours: number;    // 0–23
  minutes: number;  // 0–59
}

/* =========================
   Pending follow-up state
========================= */

export interface PendingFollowup {
  // סוג הכוונה המקורית
  intentType: "task" | "meeting";

  // כותרת / נושא
  title: string;

  // מה חסר כרגע
  missing: MissingField;

  // מה כבר זוהה (אופציונלי)
  date?: string; // YYYY-MM-DD (resolved absolute date)

  startTime?: TimeOfDay;
  endTime?: TimeOfDay;

  // הביטוי המקורי של הזמן (ל־debug / UX)
  rawTimeExpression?: string;

  // זמן יצירה (ל־timeout עתידי)
  createdAt: number;
}
