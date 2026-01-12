import { ActionPlan, Action } from "./types";

import { createTask } from "./handlers/createTask";
import { createMeeting } from "./handlers/createMeeting";
import { saveIdea } from "./handlers/saveIdea";
import { sendWhatsapp } from "./handlers/sendWhatsapp";
import { requestFollowup } from "./handlers/requestFollowup";

/**
 * Executes a full action plan sequentially
 */
export async function executeActionPlan(plan: ActionPlan) {
  for (const action of plan.actions) {
    await executeAction(action);
  }
}

/**
 * Executes a single action
 */
async function executeAction(action: Action) {
  switch (action.type) {
    case "CREATE_TASK":
      return createTask(action);

    case "CREATE_MEETING":
      return createMeeting(action);

    case "SAVE_IDEA":
      return saveIdea(action);

    case "SEND_WHATSAPP":
      return sendWhatsapp(action);

    case "REQUEST_FOLLOWUP":
      return requestFollowup(action);

    default: {
      // Safety net – should never happen
      console.warn("⚠️ Unknown action type:", action);
      return;
    }
  }
}
