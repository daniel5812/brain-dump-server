import { TodoistApi } from "@doist/todoist-api-typescript";
import dotenv from "dotenv";
dotenv.config();

const api = new TodoistApi(process.env.TODOIST_API_TOKEN!);

const HEBREW_WEEKDAYS: Record<string, number> = {
  "יום ראשון": 0,
  "יום שני": 1,
  "יום שלישי": 2,
  "יום רביעי": 3,
  "יום חמישי": 4,
  "יום שישי": 5,
  "שבת": 6,
};

function getNextWeekdayDate(targetDay: number): string {
  const today = new Date();
  const todayDay = today.getDay();

  let diff = targetDay - todayDay;
  if (diff <= 0) diff += 7; // תמיד הקרוב הבא

  const result = new Date(today);
  result.setDate(today.getDate() + diff);

  return result.toISOString().split("T")[0]; // YYYY-MM-DD
}

function resolveDueDate(due: string | null): {
  dueString?: string;
  dueDate?: string;
} {
  if (!due) return {};

  if (due === "היום") return { dueString: "today" };
  if (due === "מחר") return { dueString: "tomorrow" };

  const weekday = HEBREW_WEEKDAYS[due];
  if (weekday !== undefined) {
    return { dueDate: getNextWeekdayDate(weekday) };
  }

  return {}; // fallback בטוח
}

export async function createTodoistTask(
  title: string,
  due: string | null
) {
  const resolved = resolveDueDate(due);

  const taskArgs: any = {
    content: title,
  };

  if (resolved.dueString) {
    taskArgs.dueString = resolved.dueString;
  } else if (resolved.dueDate) {
    taskArgs.dueDate = resolved.dueDate;
  }

  return api.addTask(taskArgs);
}
