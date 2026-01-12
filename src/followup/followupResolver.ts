// src/followup/followupResolver.ts

import { PendingFollowup } from "./followupTypes";
import { resolveDateFromText } from "./dateResolver";
import { ActionPlan } from "../actions/types";

export function resolveFollowup(
  pending: PendingFollowup,
  userReply: string
): ActionPlan {

  // 🟡 חסר תאריך
  if (pending.missing === "DATE") {
    const resolvedDate = resolveDateFromText(userReply);

    if (!resolvedDate) {
      return {
        actions: [
          {
            type: "SEND_WHATSAPP",
            message: "📅 לא הצלחתי להבין את היום. אפשר לנסח אחרת?",
          },
        ],
      };
    }

    // יש שעות מההודעה המקורית?
    const start = new Date(resolvedDate);
    const end = new Date(resolvedDate);

    if (pending.startTime && pending.endTime) {
      start.setHours(pending.startTime.hours, pending.startTime.minutes);
      end.setHours(pending.endTime.hours, pending.endTime.minutes);
    }

    return {
      actions: [
        {
          type: "CREATE_MEETING",
          title: pending.title,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        {
          type: "SEND_WHATSAPP",
          message: `📅 פגישה נקבעה: ${pending.title}`,
        },
      ],
    };
  }

  // fallback
  return {
    actions: [
      {
        type: "SEND_WHATSAPP",
        message: "🤔 לא הצלחתי להשלים את הבקשה.",
      },
    ],
  };
}
