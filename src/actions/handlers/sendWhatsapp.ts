import { SendWhatsappAction } from "../types";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function sendWhatsapp(
  action: SendWhatsappAction,
  context?: { userId: string }
) {
  await sendWhatsAppMessage(
    action.message,
    context?.userId
  );
}
