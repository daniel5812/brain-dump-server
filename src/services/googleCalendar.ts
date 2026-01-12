import { google } from "googleapis";
import { getOAuthClient } from "./googleAuth";

export async function createCalendarEvent(
  title: string,
  startISO: string,
  endISO: string
) {
  const auth = getOAuthClient();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: {
        dateTime: startISO,
        timeZone: "Asia/Jerusalem",
      },
      end: {
        dateTime: endISO,
        timeZone: "Asia/Jerusalem",
      },
    },
  });
}
