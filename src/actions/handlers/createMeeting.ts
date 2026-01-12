import { CreateMeetingAction } from "../types";
import { createCalendarEvent } from "../../services/googleCalendar";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function createMeeting(action: CreateMeetingAction) {
  await createCalendarEvent(
    action.title,
    action.start,
    action.end
  );

  await sendWhatsAppMessage(
    `📅 פגישה נקבעה:\n${action.title}\n🕒 ${new Date(action.start).toLocaleString("he-IL")}`
  );
}
