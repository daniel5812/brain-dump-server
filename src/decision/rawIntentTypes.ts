// src/decision/rawIntentTypes.ts

/**
 * זהו הפורמט היחיד שמותר ל-LLM להחזיר
 * כל שינוי בהבנה קורה בשכבות מעל (resolveIntent)
 */
export type RawIntent = {
  /**
   * ההשערה של המודל
   * (לא מחייב שנאמין לה)
   */
  hypothesis: "task" | "meeting" | "idea";

  /**
   * כותרת קצרה לפעולה
   * למשל: "פגישה עם דוד"
   */
  title: string;

  /**
   * תאריך התחלה מוחלט אם המודל הצליח לחלץ
   * ISO string (YYYY-MM-DDTHH:mm)
   */
  start?: string | null;

  /**
   * תאריך סיום מוחלט אם המודל הצליח לחלץ
   * ISO string
   */
  end?: string | null;

  /**
   * תאריך יעד למשימה
   * YYYY-MM-DD
   */
  due?: string | null;

  /**
   * ביטוי זמן חופשי כפי שנאמר ע"י המשתמש
   * למשל:
   * "מחר מ-10 עד 11"
   * "ביום ראשון בצהריים"
   */
  relativeTime?: string | null;

  /**
   * רמת ביטחון של המודל (0–1)
   */
  confidence: number;

  /**
   * אותות שה-LLM זיהה בטקסט
   * משמשים אותנו כדי לדעת מה חסר באמת
   */
  signals: {
    hasDate: boolean;
    hasTime: boolean;
    hasTimeRange: boolean;
  };
};
