// src/services/whatsapp.ts
// Uses Green API for WhatsApp messaging (multi-user)

import dotenv from "dotenv";
import { getUserConfigSync } from "../users/userStore";

dotenv.config();

/* =========================
   GREEN API CONFIG
========================= */

const GREEN_API_URL = process.env.GREEN_API_URL || "https://api.green-api.com";
const INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const API_TOKEN = process.env.GREEN_API_TOKEN;
const DEFAULT_PHONE = process.env.GREEN_API_PHONE;

/* =========================
   HELPERS
========================= */

/**
 * Convert phone number to Green API chatId format
 */
function formatChatId(phone: string): string {
  let cleaned = phone
    .replace("whatsapp:", "")
    .replace("+", "")
    .replace(/@c\.us$/, "")
    .trim();

  return `${cleaned}@c.us`;
}

/**
 * Resolve WhatsApp destination by userId
 */
function resolveWhatsappTo(userId?: string): string {
  if (userId) {
    // Try to get phone from user config (sync for simplicity)
    const userConfig = getUserConfigSync(userId);
    if (userConfig?.phone) {
      return formatChatId(userConfig.phone);
    }
    return formatChatId(userId);
  }

  if (!DEFAULT_PHONE) {
    throw new Error("Missing GREEN_API_PHONE in environment");
  }

  return formatChatId(DEFAULT_PHONE);
}

/* =========================
   PUBLIC API
========================= */

export async function sendWhatsAppMessage(
  message: string,
  userId?: string
) {
  if (process.env.TEST_MODE === "true" || process.env.DISABLE_WHATSAPP === "true") {
    console.log("🟡 WhatsApp sending is DISABLED");
    console.log("📨 Message:", message);
    console.log("👤 To:", userId ?? "(default)");
    return;
  }

  if (!INSTANCE_ID || !API_TOKEN) {
    throw new Error("Missing GREEN_API_INSTANCE_ID or GREEN_API_TOKEN");
  }

  const chatId = resolveWhatsappTo(userId);
  const url = `${GREEN_API_URL}/waInstance${INSTANCE_ID}/sendMessage/${API_TOKEN}`;

  console.log("📤 Sending WhatsApp via Green API...");
  console.log("   To:", chatId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Green API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ WhatsApp sent! ID:", result.idMessage);
    return result;

  } catch (error: any) {
    console.error("❌ WhatsApp send failed:", error.message);
    throw error;
  }
}
