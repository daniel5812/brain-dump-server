// src/followup/followupResolver.ts

import { PendingFollowup } from "./followupTypes";
import { resolveDateFromText, resolveTimeFromText, buildDateTime } from "./dateResolver";
import { ActionPlan } from "../actions/types";
import { updatePendingFollowup } from "./followupStore";

/**
 * Resolves a follow-up user reply and completes the original intent
 * 
 * @param pending - The pending follow-up state
 * @param userReply - The user's reply text
 * @param userId - The user ID (needed to update pending state)
 */
export function resolveFollowup(
  pending: PendingFollowup,
  userReply: string,
  userId: string
): ActionPlan {
  // 🔗 משלבים את הביטוי המקורי + תשובת המשתמש
  const combinedText = pending.rawTimeExpression
    ? `${pending.rawTimeExpression} ${userReply}`
    : userReply;

  // At the start:
  // Use saved date if available, otherwise parse from reply
  const date = pending.date
    ? new Date(pending.date)
    : resolveDateFromText(combinedText);

  // Use saved time if available, otherwise parse from reply
  const time = pending.startTime
    ? { hour: pending.startTime.hours, minute: pending.startTime.minutes, confidence: 1 }
    : resolveTimeFromText(combinedText);

  const hasDate = !!date;
  const hasTime = time.hour !== undefined;

  /* =========================
     MISSING DATE
  ========================= */
  if (pending.missing === "DATE") {
    if (!hasDate) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "📅 עדיין חסר לי היום. מתי זה? (מחר / ביום ראשון / 1.1)",
          },
        ],
      };
    }

    if (!hasTime) {
      // ✅ Got date! Save it and ask for time
      updatePendingFollowup(userId, {
        date: date.toISOString().split("T")[0],  // Save as YYYY-MM-DD
        missing: "TIME",      // Now only time is missing
      });

      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "🕒 הבנתי את היום. באיזו שעה זה? (12 בצהריים / 7 בערב / 08:30)",
          },
        ],
      };
    }
  }

  /* =========================
     MISSING TIME
  ========================= */
  if (pending.missing === "TIME") {
    if (!hasTime) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "🕒 עדיין חסרה לי שעה. באיזו שעה זה? (12 בצהריים / 7 בערב / 08:30)",
          },
        ],
      };
    }

    if (!hasDate) {
      // ✅ Got time! Save it and ask for date
      updatePendingFollowup(userId, {
        startTime: { hours: time.hour!, minutes: time.minute ?? 0 },
        missing: "DATE",      // Now only date is missing
      });

      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "📅 הבנתי את השעה. באיזה יום זה? (מחר / ביום ראשון / 1.1)",
          },
        ],
      };
    }
  }

  /* =========================
     MISSING DATE + TIME
  ========================= */
  if (pending.missing === "DATE_TIME_RANGE") {
    // Got date but not time
    if (hasDate && !hasTime) {
      updatePendingFollowup(userId, {
        date: date.toISOString().split("T")[0],  // Save as YYYY-MM-DD
        missing: "TIME",      // Now only time is missing
      });

      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "🕒 הבנתי את היום! באיזו שעה? (12 בצהריים / 7 בערב / 08:30)",
          },
        ],
      };
    }

    // Got time but not date
    if (!hasDate && hasTime) {
      updatePendingFollowup(userId, {
        startTime: { hours: time.hour!, minutes: time.minute ?? 0 },
        missing: "DATE",      // Now only date is missing
      });

      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "📅 הבנתי את השעה! באיזה יום? (מחר / ביום ראשון / 1.1)",
          },
        ],
      };
    }

    // Got neither
    if (!hasDate && !hasTime) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message:
              "🤔 כדי להשלים אני צריך גם יום וגם שעה. (מחר ב-12 / ביום ראשון בשש בערב)",
          },
        ],
      };
    }
  }

  /* =========================
     BUILD FINAL DATETIME
  ========================= */
  if (!date || !hasTime) {
    return {
      actions: [
        {
          type: "SEND_WHATSAPP",
          message:
            "🤔 לא הצלחתי להשלים את הבקשה. נסה לכתוב יום ושעה יחד.",
        },
      ],
    };
  }

  const start = buildDateTime(date, time);
  if (!start) {
    return {
      actions: [
        {
          type: "SEND_WHATSAPP",
          message:
            "🤔 הייתה לי בעיה להבין את השעה. אפשר לנסח שוב?",
        },
      ],
    };
  }

  // ⏱️ ברירת מחדל: פגישה של שעה
  const startDate = new Date(start);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  const end = endDate.toISOString();

  /* =========================
     FINAL ACTION PLAN
  ========================= */
  if (pending.intentType === "meeting") {
    return {
      actions: [
        {
          type: "CREATE_MEETING",
          title: pending.title,
          start,
          end,
        },
        {
          type: "SEND_WHATSAPP",
          message: `📅 פגישה נקבעה: ${pending.title}`,
        },
      ],
    };
  }

  // task fallback
  return {
    actions: [
      {
        type: "CREATE_TASK",
        title: pending.title,
        due: start,
      },
      {
        type: "SEND_WHATSAPP",
        message: `📋 יצרתי משימה: ${pending.title}`,
      },
    ],
  };
}
