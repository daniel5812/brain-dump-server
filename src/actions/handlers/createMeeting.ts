import { CreateMeetingAction } from "../types";
import { createCalendarEvent } from "../../services/googleCalendar";
import { sendWhatsAppMessage } from "../../services/whatsapp";

/**
 * Creates a calendar meeting for a specific user
 */
export async function createMeeting(
  action: CreateMeetingAction,
  context?: { userId?: string }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const userId = context?.userId;

  // Create event with safe token resolution
  const result = await createCalendarEvent(
    action.title,
    action.start,
    action.end,
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
    `📅 פגישה נקבעה:\n${action.title}\n🕒 ${new Date(action.start).toLocaleString("he-IL")}`,
    userId
  );

  return { ok: true };
}
