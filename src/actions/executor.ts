import { ActionPlan, Action } from "./types";

import { createTask } from "./handlers/createTask";
import { createMeeting } from "./handlers/createMeeting";
import { saveIdea } from "./handlers/saveIdea";
import { sendWhatsapp } from "./handlers/sendWhatsapp";
import { requestFollowup } from "./handlers/requestFollowup";

/**
 * Context passed to all actions (multi-user support)
 */
export type ActionContext = {
  userId: string;
};

/**
 * Executes a full action plan sequentially
 */
export async function executeActionPlan(
  plan: ActionPlan,
  context: { userId: string }
) {
  for (const action of plan.actions) {
    await executeAction(action, context);
  }
}

/**
 * Executes a single action
 */
async function executeAction(
  action: Action,
  context: { userId: string }
) {
  switch (action.type) {
    case "CREATE_TASK":
      return createTask(action, context);

    case "CREATE_MEETING":
      return createMeeting(action, context);

    case "SAVE_IDEA":
      return saveIdea(action, context);

    case "SEND_WHATSAPP":
      return sendWhatsapp(action, context);

    case "REQUEST_FOLLOWUP":
      return requestFollowup(action, context);

    default: {
      // Safety net – should never happen
      console.warn("⚠️ Unknown action type:", action);
      return;
    }
  }
}
