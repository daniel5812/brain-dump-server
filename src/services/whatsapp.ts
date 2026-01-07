import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsAppMessage(message: string) {
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: process.env.TWILIO_WHATSAPP_TO!,
    body: message,
  });
}
