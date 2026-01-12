// src/actions/handlers/requestFollowup.ts

import { RequestFollowupAction } from "../types";
import { sendWhatsAppMessage } from "../../services/whatsapp";
import { setPendingFollowup } from "../../followup/followupStore";

/**
 * שומר מצב follow-up ושולח שאלה למשתמש
 * אין כאן לוגיקה עסקית — רק state + UX
 */
export async function requestFollowup(action: RequestFollowupAction) {
  setPendingFollowup({
    // סוג הכוונה המקורית (task / meeting)
    intentType: action.intentType,

    // כותרת הבקשה המקורית
    title: action.title,

    // איזה מידע חסר
    missing: action.missing,

    // מידע שכבר יש (אם קיים)
    startTime: action.startTime as any,
    endTime: action.endTime as any,

    // הטקסט המקורי שממנו חילצנו את הזמן
    rawTimeExpression: action.context,

    // חותמת זמן (ל-timeout עתידי)
    createdAt: Date.now(),
  });

  // שאלה למשתמש (WhatsApp / iOS Shortcut וכו׳)
  await sendWhatsAppMessage(action.question);
}
