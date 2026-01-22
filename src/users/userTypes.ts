// src/users/userTypes.ts

/**
 * User configuration stored per-user
 * File location: data/users/{userId}.json
 */
export interface UserConfig {
    /** User ID (phone number format: 972502765495) */
    userId: string;

    /** WhatsApp phone number (without + or prefixes) */
    phone: string;

    /** Optional display name */
    name?: string;

    /** Green API - per user if they have their own instance */
    greenApiInstanceId?: string;
    greenApiToken?: string;
    greenApiUrl?: string;

    /** Optional custom Todoist token (fallback to env) */
    todoistToken?: string;

    /** Optional custom calendar ID (fallback to env) */
    calendarId?: string;

    /** HMAC secret for this user (if per-user auth needed) */
    hmacSecret?: string;

    /** If true, allowed to use system ENV tokens (admin/demo only) */
    useSystemDefaults?: boolean;

    /** If true, user has connected required integrations */
    onboardingComplete?: boolean;

    /** Timestamp when user was created */
    createdAt: number;

    /** Timestamp of last activity */
    lastActiveAt?: number;
}

/**
 * Minimal data required to register a new user
 */
export interface RegisterUserInput {
    phone: string;
    name?: string;
}
