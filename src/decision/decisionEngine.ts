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

export function decide(intent: Intent) {
  switch (intent.type) {
    case "task":
      return handleTask(intent);

    case "note":
      return handleNote(intent);

    case "idea":
      return handleIdea(intent);

    default:
      throw new Error("Unknown intent type");
  }
}

function handleTask(intent: TaskIntent) {
  console.log("📋 DECISION: Create TASK");
  console.log("• Title:", intent.title);
  console.log("• Due:", intent.due);
  console.log("• Confidence:", intent.confidence);

  return {
    action: "CREATE_TASK",
    payload: intent,
  };
}

function handleNote(intent: NoteIntent) {
  console.log("📝 DECISION: Save NOTE");
  console.log("• Content:", intent.content);
  console.log("• Confidence:", intent.confidence);

  return {
    action: "SAVE_NOTE",
    payload: intent,
  };
}

function handleIdea(intent: IdeaIntent) {
  console.log("💡 DECISION: Store IDEA");
  console.log("• Content:", intent.content);
  console.log("• Confidence:", intent.confidence);

  return {
    action: "STORE_IDEA",
    payload: intent,
  };
}
