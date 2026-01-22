// src/services/email/allowedUsers.ts
// List of allowed users (phone numbers)

export const ALLOWED_USERS: string[] = [
    "972502765495",  // Daniel
    // Add more users here:
    // "972501234567",
];

/**
 * Check if a user is in the allowed list
 */
export function isUserAllowed(userId: string): boolean {
    // Clean the userId (remove non-digits)
    const cleanId = userId.replace(/\D/g, "");
    return ALLOWED_USERS.includes(cleanId);
}
