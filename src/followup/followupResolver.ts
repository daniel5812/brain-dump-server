// src/followup/followupResolver.ts

import { PendingFollowup } from "./followupTypes";
import { resolveDateTimeFromText } from "./dateResolver";
import { ActionPlan } from "../actions/types";

function addMinutes(iso: string, minutesToAdd: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutesToAdd);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
}

export function resolveFollowup(
  pending: PendingFollowup,
  userReply: string
): ActionPlan {
  const combined = pending.rawTimeExpression
    ? `${pending.rawTimeExpression} ${userReply}`
    : userReply;

  const { date, time, iso } = resolveDateTimeFromText(combined);

  // ---------------------------
  // Missing DATE
  // ---------------------------
  if (pending.missing === "DATE") {
    if (!date) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message: "📅 עדיין חסר לי יום. מתי זה? (מחר / ביום ראשון / 1.1)",
          },
        ],
      };
    }

    // אם אין שעה קיימת – נבקש שעה
    if (!pending.startTime?.hours && time.hour === undefined) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message: "🕒 הבנתי את היום. באיזו שעה זה? (12 בצהריים / 7 בערב / 08:30)",
          },
        ],
      };
    }
  }

  // ---------------------------
  // Missing TIME
  // ---------------------------
  if (pending.missing === "TIME") {
    if (time.hour === undefined) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message: "🕒 עדיין חסרה לי שעה. באיזו שעה זה? (12 בצהריים / 7 בערב / 08:30)",
          },
        ],
      };
    }
  }

  // ---------------------------
  // Missing DATE_TIME_RANGE (כלומר צריך יום+שעה)
  // ---------------------------
  if (pending.missing === "DATE_TIME_RANGE") {
    if (!date || time.hour === undefined) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message: "🤔 כדי להשלים אני צריך גם יום וגם שעה. (מחר ב-12 / ביום ראשון בשש בערב)",
          },
        ],
      };
    }
  }

  // עכשיו נוודא שיש לנו ISO מלא עבור meeting/task
  // meeting דורש date+time -> iso לא null
  if (!date || time.hour === undefined || !iso) {
    return {
      actions: [
        {
          type: "SEND_WHATSAPP",
          message: "🤔 לא הצלחתי להשלים את הבקשה. נסה לכתוב יום ושעה יחד (למשל: מחר ב-12 בצהריים).",
        },
      ],
    };
  }

  // ---------------------------
  // Build final plan
  // ---------------------------
  if (pending.intentType === "meeting") {
    // ברירת מחדל: פגישה 60 דקות
    const end = addMinutes(iso, 60);

    return {
      actions: [
        {
          type: "CREATE_MEETING",
          title: pending.title,
          start: iso,
          end,
        },
        {
          type: "SEND_WHATSAPP",
          message: `📅 פגישה נקבעה: ${pending.title}`,
        },
      ],
    };
  }

  // task
  return {
    actions: [
      {
        type: "CREATE_TASK",
        title: pending.title,
        // Todoist: אתה יכול להשאיר null אם אתה לא רוצה due,
        // אבל אם כבר זוהה זמן – עדיף לשים ISO.
        due: iso,
      },
      {
        type: "SEND_WHATSAPP",
        message: `📋 יצרתי משימה: ${pending.title}`,
      },
    ],
  };
}
