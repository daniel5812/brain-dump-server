import { google } from "googleapis";
import path from "path";

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "../../secrets/google-service-account.json"
    ),
    scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
    version: "v3",
    auth,
});

export async function createCalendarEvent({
    title,
    start,
    end,
}: {
    title: string;
    start: string;
    end: string;
}) {
    const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
            summary: title,
            start: { dateTime: start },
            end: { dateTime: end },
        },
    });

    return res.data;
}
