import { PendingFollowup } from "./followupTypes";

/**
 * ⚠️ כרגע store בזיכרון בלבד
 * בעתיד ניתן להחליף ל-Redis / DB
 */
let pending: PendingFollowup | null = null;

/**
 * שומר followup ממתין
 */
export function setPendingFollowup(data: PendingFollowup) {
  pending = data;
}

/**
 * מחזיר followup אם קיים
 */
export function getPendingFollowup(): PendingFollowup | null {
  return pending;
}

/**
 * מנקה followup לאחר פתרון
 */
export function clearPendingFollowup() {
  pending = null;
}
