// src/users/userStore.ts
// Multi-user config store with Supabase PostgreSQL

import fs from "fs";
import path from "path";
import { supabase, isSupabaseEnabled } from "../db/supabase";
import { UserConfig, RegisterUserInput } from "./userTypes";

/* =========================
   DATABASE OPERATIONS
========================= */

/**
 * Get user by phone from Supabase
 */
async function getUserFromDb(phone: string): Promise<UserConfig | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

    if (error || !data) return null;

    return {
        userId: data.phone,
        phone: data.phone,
        name: data.name,
        greenApiInstanceId: data.green_api_instance_id,
        greenApiToken: data.green_api_token,
        greenApiUrl: data.green_api_url,
        todoistToken: data.todoist_token,
        calendarId: data.calendar_id,
        hmacSecret: data.hmac_secret,
        useSystemDefaults: data.use_system_defaults ?? false,
        onboardingComplete: data.onboarding_complete ?? false,
        createdAt: new Date(data.created_at).getTime(),
        lastActiveAt: data.last_active_at ? new Date(data.last_active_at).getTime() : undefined,
    };
}

/**
 * Create or update user in Supabase
 */
async function upsertUserToDb(config: UserConfig): Promise<void> {
    if (!supabase) return;

    await supabase.from("users").upsert({
        phone: config.phone,
        name: config.name,
        green_api_instance_id: config.greenApiInstanceId,
        green_api_token: config.greenApiToken,
        green_api_url: config.greenApiUrl,
        todoist_token: config.todoistToken,
        calendar_id: config.calendarId,
        hmac_secret: config.hmacSecret,
        use_system_defaults: config.useSystemDefaults ?? false,
        onboarding_complete: config.onboardingComplete ?? false,
        last_active_at: new Date().toISOString(),
    }, {
        onConflict: "phone",
    });
}

/**
 * Update last active timestamp
 */
async function touchUserInDb(phone: string): Promise<void> {
    if (!supabase) return;

    await supabase
        .from("users")
        .update({ last_active_at: new Date().toISOString() })
        .eq("phone", phone);
}

/* =========================
   JSON FILE FALLBACK
========================= */

const DATA_DIR = path.join(process.cwd(), "data", "users");

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function getUserFilePath(userId: string): string {
    const safeId = userId.replace(/[^a-zA-Z0-9]/g, "");
    return path.join(DATA_DIR, `${safeId}.json`);
}

function getUserFromFile(userId: string): UserConfig | null {
    ensureDataDir();
    const filePath = getUserFilePath(userId);

    if (!fs.existsSync(filePath)) return null;

    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data) as UserConfig;
    } catch {
        return null;
    }
}

function setUserToFile(config: UserConfig): void {
    ensureDataDir();
    const filePath = getUserFilePath(config.userId);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

/* =========================
   PUBLIC API
========================= */

/**
 * Check if a user exists
 */
export async function userExists(userId: string): Promise<boolean> {
    const config = await getUserConfig(userId);
    return config !== null;
}

/**
 * Get user config by userId (phone number)
 */
export async function getUserConfig(userId: string): Promise<UserConfig | null> {
    const phone = userId.replace(/\D/g, "");

    // Try Supabase first
    if (isSupabaseEnabled()) {
        const dbUser = await getUserFromDb(phone);
        if (dbUser) return dbUser;
    }

    // Fallback to JSON file
    return getUserFromFile(phone);
}

/**
 * Create or update user config
 */
export async function setUserConfig(config: UserConfig): Promise<void> {
    // Save to Supabase if enabled
    if (isSupabaseEnabled()) {
        await upsertUserToDb(config);
    }

    // Always save to file as backup
    setUserToFile(config);
}

/**
 * Register a new user
 */
export async function registerUser(input: RegisterUserInput): Promise<UserConfig> {
    const userId = input.phone.replace(/\D/g, "");

    // Check if already exists
    const existing = await getUserConfig(userId);
    if (existing) {
        existing.lastActiveAt = Date.now();
        await setUserConfig(existing);
        return existing;
    }

    // Create new user
    const newUser: UserConfig = {
        userId,
        phone: userId,
        name: input.name,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
    };

    await setUserConfig(newUser);
    console.log(`✅ New user registered: ${userId}`);
    return newUser;
}

/**
 * Update last active timestamp
 */
export async function touchUser(userId: string): Promise<void> {
    const phone = userId.replace(/\D/g, "");

    if (isSupabaseEnabled()) {
        await touchUserInDb(phone);
    }

    const user = await getUserConfig(userId);
    if (user) {
        user.lastActiveAt = Date.now();
        setUserToFile(user);
    }
}

/**
 * Get or create user by phone number
 */
export async function getOrCreateUser(phone: string): Promise<UserConfig> {
    const userId = phone.replace(/\D/g, "");
    const existing = await getUserConfig(userId);

    if (existing) {
        await touchUser(userId);
        return existing;
    }

    return registerUser({ phone });
}

/**
 * Sync version for backwards compatibility
 * Uses cached file data
 */
export function getUserConfigSync(userId: string): UserConfig | null {
    const phone = userId.replace(/\D/g, "");
    return getUserFromFile(phone);
}
