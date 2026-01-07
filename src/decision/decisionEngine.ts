import { createTodoistTask } from "../services/todoist";
import { sendWhatsAppMessage } from "../services/whatsapp";

type TaskIntent = {
  type: "task";
  title: string;
  due: string | null;
  confidence: number;
};

type NoteIntent = {
  type: "note";
  content: string;
  confidence: number;
};

type IdeaIntent = {
  type: "idea";
  content: string;
  confidence: number;
};

type Intent = TaskIntent | NoteIntent | IdeaIntent;

const MIN_CONFIDENCE = 0.75;

export async function decide(intent: Intent) {
  switch (intent.type) {
    case "task":
      return await handleTask(intent);
    case "note":
      return await handleNote(intent);
    case "idea":
      return await handleIdea(intent);
    default:
      throw new Error("Unknown intent type");
  }
}

/* ---------- TASK ---------- */

async function handleTask(intent: TaskIntent) {
  if (intent.confidence < MIN_CONFIDENCE) {
    await sendWhatsAppMessage(
      "⚠️ לא הייתי בטוח מספיק, אז לא יצרתי משימה."
    );
    return { action: "SKIPPED_LOW_CONFIDENCE" };
  }

  const task = await createTodoistTask(intent.title, intent.due);

  await sendWhatsAppMessage(
    `✅ נוצרה משימה:\n${intent.title}${
      intent.due ? `\n📅 ${intent.due}` : ""
    }`
  );

  return {
    action: "TASK_CREATED",
    externalId: task.id,
  };
}

/* ---------- NOTE ---------- */

async function handleNote(intent: NoteIntent) {
  await sendWhatsAppMessage(
    `📝 נשמרה הערה:\n${intent.content}`
  );

  return { action: "NOTE_RECEIVED" };
}

/* ---------- IDEA ---------- */

async function handleIdea(intent: IdeaIntent) {
  await sendWhatsAppMessage(
    `💡 נשמר רעיון:\n${intent.content}`
  );

  return { action: "IDEA_RECEIVED" };
}
