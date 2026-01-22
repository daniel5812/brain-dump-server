// src/users/integrationResolver.ts
// Safe token resolution with explicit onboarding requirements

import { UserConfig } from "./userTypes";

/**
 * Integration status for a user
 */
export interface IntegrationStatus {
    todoist: boolean;
    calendar: boolean;
    whatsapp: boolean;
}

/**
 * Result of attempting to get an integration token
 */
export type TokenResult =
    | { ok: true; token: string }
    | { ok: false; reason: "NOT_CONFIGURED" | "USER_NOT_FOUND" };

/**
 * Check which integrations a user has configured
 */
export function getIntegrationStatus(user: UserConfig | null): IntegrationStatus {
    if (!user) {
        return { todoist: false, calendar: false, whatsapp: false };
    }

    return {
        todoist: !!user.todoistToken,
        calendar: !!user.calendarId,
        whatsapp: !!user.phone,
    };
}

/**
 * Check if user needs onboarding for a specific integration
 */
export function needsIntegration(
    user: UserConfig | null,
    integration: "todoist" | "calendar"
): boolean {
    if (!user) return true;

    const status = getIntegrationStatus(user);
    return !status[integration];
}

/**
 * Get Todoist token for a user (safe resolution)
 */
export function getTodoistToken(user: UserConfig | null): TokenResult {
    if (!user) {
        return { ok: false, reason: "USER_NOT_FOUND" };
    }

    // User has their own token
    if (user.todoistToken) {
        return { ok: true, token: user.todoistToken };
    }

    // Explicitly allowed to use system defaults
    if (user.useSystemDefaults && process.env.TODOIST_API_TOKEN) {
        return { ok: true, token: process.env.TODOIST_API_TOKEN };
    }

    // Not configured
    return { ok: false, reason: "NOT_CONFIGURED" };
}

/**
 * Get Calendar ID for a user (safe resolution)
 */
export function getCalendarId(user: UserConfig | null): TokenResult {
    if (!user) {
        return { ok: false, reason: "USER_NOT_FOUND" };
    }

    // User has their own calendar
    if (user.calendarId) {
        return { ok: true, token: user.calendarId };
    }

    // Explicitly allowed to use system defaults
    if (user.useSystemDefaults && process.env.GOOGLE_CALENDAR_ID) {
        return { ok: true, token: process.env.GOOGLE_CALENDAR_ID };
    }

    // Not configured
    return { ok: false, reason: "NOT_CONFIGURED" };
}

/**
 * Get WhatsApp phone for a user
 */
export function getWhatsAppPhone(user: UserConfig | null): TokenResult {
    if (!user) {
        return { ok: false, reason: "USER_NOT_FOUND" };
    }

    if (user.phone) {
        return { ok: true, token: user.phone };
    }

    return { ok: false, reason: "NOT_CONFIGURED" };
}

/**
 * Get missing integrations for a user
 */
export function getMissingIntegrations(user: UserConfig | null): string[] {
    const missing: string[] = [];
    const status = getIntegrationStatus(user);

    if (!status.todoist) missing.push("todoist");
    if (!status.calendar) missing.push("calendar");

    return missing;
}

/**
 * Onboarding messages in Hebrew
 * Clear instructions for users on how to connect their integrations
 */
export const ONBOARDING_MESSAGES = {
    todoist: `📋 Todoist עדיין לא מחובר.

כדי לחבר:
1. פתח את Todoist באתר או באפליקציה
2. לך להגדרות → Integrations → API Token
3. העתק את הטוקן ושלח אותו למנהל המערכת

⏳ החיבור ייקח כמה דקות`,

    calendar: `📅 Google Calendar עדיין לא מחובר.

כדי לחבר:
1. שלח למנהל המערכת את כתובת המייל של ה-Google שלך
2. הוא ישתף איתך את היומן

⏳ החיבור ייקח כמה דקות`,

    general: `👋 שלום! ברוכים הבאים ל-Brain Dump.

כדי להתחיל, צריך לחבר את הכלים שלך:
• Todoist - למשימות
• Google Calendar - לפגישות

שלח למנהל המערכת את הטוקנים שלך להגדרה.`,

    welcome: `🎉 ברוכים הבאים ל-Brain Dump!

המערכת מזהה אותך לראשונה.
כדי להשתמש בשירות, צריך לחבר את הכלים:

📋 Todoist: שלח את ה-API Token שלך
📅 Calendar: שלח את כתובת ה-Gmail שלך

שלח את הפרטים למנהל המערכת.`,
} as const;

/**
 * Get appropriate onboarding message based on what's missing
 */
export function getOnboardingMessage(user: UserConfig | null): string {
    if (!user) {
        return ONBOARDING_MESSAGES.welcome;
    }

    const missing = getMissingIntegrations(user);

    if (missing.length === 0) {
        return "✅ כל הכלים מחוברים!";
    }

    if (missing.includes("todoist") && missing.includes("calendar")) {
        return ONBOARDING_MESSAGES.general;
    }

    if (missing.includes("todoist")) {
        return ONBOARDING_MESSAGES.todoist;
    }

    if (missing.includes("calendar")) {
        return ONBOARDING_MESSAGES.calendar;
    }

    return ONBOARDING_MESSAGES.general;
}
