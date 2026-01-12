// src/followup/followupTypes.ts

export type MissingField = "DATE" | "TIME" | "DATE_TIME_RANGE";

export interface TimeOfDay {
  hours: number;   // 0–23
  minutes: number; // 0–59
}

/**
 * מצב follow-up שממתין לתשובת משתמש
 * - rawTimeExpression: ההקשר המקורי ("יום ראשון", "מחר בשעה 11", וכו')
 * - date/startTime/endTime: מה שכבר זוהה (אם זוהה)
 */
export interface PendingFollowup {
  intentType: "meeting" | "task"; // כרגע אתה משתמש בזה כך בפועל
  title: string;

  missing: MissingField;

  // מה שכבר זוהה (אופציונלי)
  date?: string; // YYYY-MM-DD
  startTime?: TimeOfDay;
  endTime?: TimeOfDay;

  rawTimeExpression?: string;
  createdAt: number;
}
