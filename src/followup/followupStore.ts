import { PendingFollowup } from "./followupTypes";

/**
 * ⚠️ In-memory follow-up store (per user)
 * key = userId
 *
 * Future: can be replaced with Redis / DB
 */
const pendingMap = new Map<string, PendingFollowup>();

/**
 * Save pending follow-up for a specific user
 */
export function setPendingFollowup(
  userId: string,
  data: PendingFollowup
) {
  pendingMap.set(userId, data);
}

/**
 * Get pending follow-up for a specific user
 */
export function getPendingFollowup(
  userId: string
): PendingFollowup | null {
  return pendingMap.get(userId) ?? null;
}

/**
 * Clear pending follow-up for a specific user
 */
export function clearPendingFollowup(userId: string) {
  pendingMap.delete(userId);
}

/**
 * Update pending follow-up with partial data (merge, not replace)
 * 
 * Use this when you've extracted some info (e.g., date) but still need more (e.g., time).
 * It keeps the original title, intentType, etc. and only updates the fields you provide.
 * 
 * @param userId - The user ID
 * @param updates - Partial fields to merge into existing state
 * @returns true if updated, false if no pending state exists
 */
export function updatePendingFollowup(
  userId: string,
  updates: Partial<PendingFollowup>
): boolean {
  const existing = pendingMap.get(userId);

  // If no existing state, nothing to update
  if (!existing) {
    return false;
  }

  // Merge: keep existing fields, override with updates
  const merged: PendingFollowup = {
    ...existing,      // Keep all original fields (title, intentType, etc.)
    ...updates,       // Override with new partial data (date, missing, etc.)
  };

  pendingMap.set(userId, merged);
  return true;
}
