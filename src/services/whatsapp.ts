import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const isWhatsAppDisabled =
  process.env.DISABLE_WHATSAPP === "true";

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return client;
}

/**
 * Centralized WhatsApp sender
 * - Always logs assistant output
 * - Optionally sends via Twilio
 */
export async function sendWhatsAppMessage(message: string) {
  // 🧠 תמיד נדע מה העוזר אמר
  console.log("🧠 Assistant says:");
  console.log(message);
  console.log("—".repeat(40));

  // ❌ WhatsApp כבוי – עוצרים כאן
  if (isWhatsAppDisabled) {
    console.log("🟡 WhatsApp sending is DISABLED");
    return;
  }

  // 🟢 WhatsApp פעיל – שולחים באמת
  const twilioClient = getTwilioClient();

  return twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: process.env.TWILIO_WHATSAPP_TO!,
    body: message,
  });
}
