// src/decision/decisionEngine.ts

import { resolveIntent } from "./resolveIntent";
import { ActionPlan } from "../actions/types";

/**
 * Decision Layer
 * --------------
 * מקבל RawIntent (מה-LLM),
 * מresolve אותו ל-intent יציב (task/meeting/idea/unclear),
 * ומתרגם אותו ל-ActionPlan שהאקסקיוטר יודע לבצע.
 */
export async function decide(rawIntent: any): Promise<ActionPlan> {
  const intent = resolveIntent(rawIntent);

  switch (intent.type) {
    /* =========================
       TASK
    ========================= */
    case "task":
      return {
        actions: [
          {
            type: "CREATE_TASK",
            title: intent.title,
            due: intent.due,
          },
          {
            type: "SEND_WHATSAPP",
            message: `📋 יצרתי משימה: ${intent.title}${
              intent.due ? ` (עד ${intent.due})` : ""
            }`,
          },
        ],
      };

    /* =========================
       MEETING
    ========================= */
    case "meeting":
      return {
        actions: [
          {
            type: "CREATE_MEETING",
            title: intent.title,
            start: intent.start,
            end: intent.end,
          },
          {
            type: "SEND_WHATSAPP",
            message: `📅 פגישה נקבעה: ${intent.title}`,
          },
        ],
      };

    /* =========================
       IDEA
    ========================= */
    case "idea":
      return {
        actions: [
          {
            type: "SAVE_IDEA",
            title: intent.title,
          },
          {
            type: "SEND_WHATSAPP",
            message: `💡 שמרתי רעיון: ${intent.title}`,
          },
        ],
      };

    /* =========================
       UNCLEAR → FOLLOW-UP
    ========================= */
    case "unclear": {
      const base = {
        type: "REQUEST_FOLLOWUP" as const,
        intentType: (rawIntent?.hypothesis ?? "task") as "task" | "meeting",
        title: intent.title,
      };

      if (intent.reason === "MISSING_DATE") {
        return {
          actions: [
            {
              ...base,
              missing: "DATE" as const,
              context: rawIntent?.relativeTime ?? rawIntent?.title ?? undefined,
              question:
                "📅 הבנתי את השעה, אבל לא את היום. מתי זה אמור לקרות? (לדוגמה: מחר / ביום ראשון הקרוב / 1.1)",
            },
          ],
        };
      }

      if (intent.reason === "MISSING_TIME") {
        return {
          actions: [
            {
              ...base,
              missing: "TIME" as const,
              context: rawIntent?.relativeTime ?? rawIntent?.title ?? undefined,
              question:
                "🕒 הבנתי את היום, אבל חסרה לי שעה. באיזו שעה זה? (לדוגמה: 12 בצהריים / 7 בערב / 08:30)",
            },
          ],
        };
      }

      return {
        actions: [
          {
            ...base,
            missing: "DATE_TIME_RANGE" as const,
            context: rawIntent?.relativeTime ?? rawIntent?.title ?? undefined,
            question:
              "🤔 כדי לבצע את זה אני צריך עוד קצת מידע: זה משימה, פגישה או רעיון? ואם זו פגישה—תן גם יום ושעה.",
          },
        ],
      };
    }
  }

  /* =========================
     SAFETY NET
  ========================= */
  return {
    actions: [
      {
        type: "SEND_WHATSAPP",
        message: "🤖 לא הצלחתי להבין, אפשר לנסח מחדש?",
      },
    ],
  };
}
