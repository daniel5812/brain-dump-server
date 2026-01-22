import { resolveIntent } from "./resolveIntent";
import { ActionPlan } from "../actions/types";

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
            message: `📋 יצרתי משימה: ${intent.title}${intent.due ? ` (עד ${intent.due})` : ""
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
    case "unclear":
      return {
        actions: [
          {
            type: "REQUEST_FOLLOWUP",
            intentType: rawIntent.hypothesis === "meeting" ? "meeting" : "task",
            title: intent.title,
            missing: "DATE_TIME_RANGE",
            context: rawIntent.relativeTime ?? undefined,
            question:
              "🤔 כדי להמשיך אני צריך עוד קצת מידע — יום ושעה (לדוגמה: מחר ב־12 / ביום ראשון בשש בערב)",
          },
        ],
      };
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
