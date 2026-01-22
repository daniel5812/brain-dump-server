// src/services/todoist.ts
// Multi-user Todoist with secure token resolution

import { TodoistApi } from "@doist/todoist-api-typescript";
import dotenv from "dotenv";
import { getUserConfigSync } from "../users/userStore";
import { getTodoistToken, ONBOARDING_MESSAGES } from "../users/integrationResolver";

dotenv.config();

/* =========================
   CONSTANTS
========================= */

const HEBREW_WEEKDAYS: Record<string, number> = {
  "יום ראשון": 0,
  "יום שני": 1,
  "יום שלישי": 2,
  "יום רביעי": 3,
  "יום חמישי": 4,
  "יום שישי": 5,
  "שבת": 6,
};

/* =========================
   HELPERS
========================= */

function getNextWeekdayDate(targetDay: number): string {
  const today = new Date();
  const todayDay = today.getDay();

  let diff = targetDay - todayDay;
  if (diff <= 0) diff += 7;

  const result = new Date(today);
  result.setDate(today.getDate() + diff);

  return result.toISOString().split("T")[0];
}

function resolveDueDate(due?: string | null): { dueString?: string; dueDate?: string } {
  if (!due) return {};

  if (due === "היום") return { dueString: "today" };
  if (due === "מחר") return { dueString: "tomorrow" };

  const weekday = HEBREW_WEEKDAYS[due];
  if (weekday !== undefined) {
    return { dueDate: getNextWeekdayDate(weekday) };
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(due)) {
    return { dueDate: due.slice(0, 10) };
  }

  return {};
}

/* =========================
   RESULT TYPES
========================= */

export type TodoistResult =
  | { ok: true; task: any }
  | { ok: false; error: "NOT_CONFIGURED"; message: string };

/* =========================
   PUBLIC API
========================= */

/**
 * Creates a Todoist task for a specific user
 * Returns an error if user has no Todoist configured
 */
export async function createTodoistTask(
  title: string,
  due?: string | null,
  userId?: string
): Promise<TodoistResult> {
  // Get user config
  const userConfig = userId ? getUserConfigSync(userId) : null;

  // Safe token resolution
  const tokenResult = getTodoistToken(userConfig);

  if (!tokenResult.ok) {
    console.log("⚠️ Todoist not configured for user:", userId);
    return {
      ok: false,
      error: "NOT_CONFIGURED",
      message: ONBOARDING_MESSAGES.todoist,
    };
  }

  // Create API client with user's token
  const api = new TodoistApi(tokenResult.token);
  const resolved = resolveDueDate(due);

  const taskArgs: any = { content: title };

  if (resolved.dueString) {
    taskArgs.dueString = resolved.dueString;
  } else if (resolved.dueDate) {
    taskArgs.dueDate = resolved.dueDate;
  }

  console.log("📋 Creating Todoist task:");
  console.log("   Title:", title);
  console.log("   User:", userId ?? "(unknown)");

  const task = await api.addTask(taskArgs);
  return { ok: true, task };
}
