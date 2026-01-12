// src/followup/followupStore.ts

import { PendingFollowup } from "./followupTypes";

let pending: PendingFollowup | null = null;

export function setPendingFollowup(data: PendingFollowup) {
  pending = data;
}

export function getPendingFollowup(): PendingFollowup | null {
  return pending;
}

export function clearPendingFollowup() {
  pending = null;
}
