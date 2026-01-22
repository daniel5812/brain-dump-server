import { CreateTaskAction } from "../types";
import { createTodoistTask } from "../../services/todoist";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function createTask(
  action: CreateTaskAction,
  context?: { userId: string }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const userId = context?.userId;

  // Create task with safe token resolution
  const result = await createTodoistTask(
    action.title,
    action.due,
    userId
  );

  // Handle not configured error
  if (!result.ok) {
    // Send onboarding message to user
    await sendWhatsAppMessage(result.message, userId);
    return {
      ok: false,
      error: result.error,
      message: result.message,
    };
  }

  // Success - send confirmation
  await sendWhatsAppMessage(
    `📋 יצרתי משימה:\n${action.title}${action.due ? `\n⏰ עד ${new Date(action.due).toLocaleString("he-IL")}` : ""}`,
    userId
  );

  return { ok: true };
}
