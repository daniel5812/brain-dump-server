import { SaveIdeaAction } from "../types";
import { sendWhatsAppMessage } from "../../services/whatsapp";

export async function saveIdea(
  action: SaveIdeaAction,
  context?: { userId: string }
) {
  // כרגע אין persistence – רק הודעה
  await sendWhatsAppMessage(
    `💡 שמרתי רעיון:\n${action.title}`,
    context?.userId
  );
}
