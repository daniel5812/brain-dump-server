import { CreateTaskAction } from "../types";
import { createTodoistTask } from "../../services/todoist";

export async function createTask(action: CreateTaskAction) {
  await createTodoistTask(action.title, action.due ?? null);
}
