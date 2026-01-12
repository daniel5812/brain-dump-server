/* =========================
   Base
========================= */

export interface BaseAction {
  type: ActionType;
}

/* =========================
   Action Types
========================= */

export type ActionType =
  | "CREATE_TASK"
  | "CREATE_MEETING"
  | "SAVE_IDEA"
  | "SEND_WHATSAPP"
  | "REQUEST_FOLLOWUP";

/* =========================
   Actions
========================= */

export interface CreateTaskAction extends BaseAction {
  type: "CREATE_TASK";
  title: string;
  due?: string;
}

export interface CreateMeetingAction extends BaseAction {
  type: "CREATE_MEETING";
  title: string;
  start: string;
  end: string;
}

export interface SaveIdeaAction extends BaseAction {
  type: "SAVE_IDEA";
  title: string;
}

export interface SendWhatsappAction extends BaseAction {
  type: "SEND_WHATSAPP";
  message: string;
}

/* 🟡 FOLLOW-UP ACTION */

export interface RequestFollowupAction extends BaseAction {
  type: "REQUEST_FOLLOWUP";

  /** על איזה intent מדובר */
  intentType: "task" | "meeting";

  /** כותרת הפעולה המקורית */
  title: string;

  /** איזה מידע חסר */
  missing: "DATE" | "TIME" | "DATE_TIME_RANGE";

  /** ביטוי הזמן המקורי (אם קיים) */
  context?: string;

  /** השאלה שתישלח למשתמש */
  question: string;
  
  startTime?: string;
  endTime?: string;
  
}

/* =========================
   Union
========================= */

export type Action =
  | CreateTaskAction
  | CreateMeetingAction
  | SaveIdeaAction
  | SendWhatsappAction
  | RequestFollowupAction;

/* =========================
   Plan
========================= */

export interface ActionPlan {
  actions: Action[];
}
