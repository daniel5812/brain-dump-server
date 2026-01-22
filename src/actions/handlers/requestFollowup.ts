import { RequestFollowupAction } from "../types";
import { setPendingFollowup } from "../../followup/followupStore";

export async function requestFollowup(
  action: RequestFollowupAction,
  context: { userId: string }
) {
  setPendingFollowup(context.userId, {
    intentType: action.intentType,
    title: action.title,
    missing: action.missing,
    rawTimeExpression: action.context,
    createdAt: Date.now(),
  });
}
