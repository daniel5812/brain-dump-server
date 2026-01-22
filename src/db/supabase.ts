// src/db/supabase.ts
// Supabase client for user data storage

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase not configured. Using fallback JSON storage.");
}

export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseEnabled(): boolean {
    return supabase !== null;
}
