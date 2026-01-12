import { SendWhatsappAction } from "../types";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function sendWhatsapp(action: SendWhatsappAction) {
  await sendWhatsAppMessage(action.message);
}
