import { SaveIdeaAction } from "../types";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function saveIdea(action: SaveIdeaAction) {
  await sendWhatsAppMessage(`💡 רעיון:\n${action.title}`);
}
