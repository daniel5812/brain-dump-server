// src/services/googleCalendar.ts
// Multi-user Google Calendar with secure token resolution

import { google } from "googleapis";
import path from "path";
import { getUserConfigSync } from "../users/userStore";
import { getCalendarId, ONBOARDING_MESSAGES } from "../users/integrationResolver";

const SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "../../secrets/brain-dump-484011-7dc82cec457d.json"
);

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

/* =========================
   RESULT TYPES
========================= */

export type CalendarResult =
  | { ok: true; event: any }
  | { ok: false; error: "NOT_CONFIGURED"; message: string };

/* =========================
   PUBLIC API
========================= */

/**
 * Creates a calendar event for a specific user
 * Returns an error if user has no calendar configured
 */
export async function createCalendarEvent(
  title: string,
  startISO: string,
  endISO: string,
  userId?: string
): Promise<CalendarResult> {
  // Get user config
  const userConfig = userId ? getUserConfigSync(userId) : null;

  // Safe calendar resolution
  const calendarResult = getCalendarId(userConfig);

  if (!calendarResult.ok) {
    console.log("⚠️ Calendar not configured for user:", userId);
    return {
      ok: false,
      error: "NOT_CONFIGURED",
      message: ONBOARDING_MESSAGES.calendar,
    };
  }

  const targetCalendar = calendarResult.token;

  console.log("📅 Creating calendar event:");
  console.log("   Title:", title);
  console.log("   User:", userId ?? "(unknown)");
  console.log("   Calendar:", targetCalendar);

  const res = await calendar.events.insert({
    calendarId: targetCalendar,
    requestBody: {
      summary: title,
      start: { dateTime: startISO, timeZone: "Asia/Jerusalem" },
      end: { dateTime: endISO, timeZone: "Asia/Jerusalem" },
    },
  });

  console.log("✅ Event created:", res.data.htmlLink);
  return { ok: true, event: res.data };
}
