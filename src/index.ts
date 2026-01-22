// src/index.ts

import express from "express";
import dotenv from "dotenv";

import { parseIntent } from "./services/openai";
import { decide } from "./decision/decisionEngine";
import { executeActionPlan } from "./actions/executor";

import {
  getPendingFollowup,
  clearPendingFollowup,
} from "./followup/followupStore";
import { resolveFollowup } from "./followup/followupResolver";

import { verifyHmac } from "./security/hmac";
import { getOrCreateUser } from "./users/userStore";
import { isUserAllowed } from "./services/email/allowedUsers";
import { sendNewUserEmail } from "./services/email/emailSender";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   HELPERS
========================= */

/**
 * Extracts the first valid JSON object from LLM output
 */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Invalid JSON from AI");
  }

  return raw.slice(start, end + 1);
}

/* =========================
   ROUTE
========================= */

app.post("/brain-dump", async (req, res) => {
  const { text, userId, timestamp, signature, mail } = req.body ?? {};

  // Validate required fields
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ ok: false, error: "Missing text" });
  }
  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ ok: false, error: "Missing userId" });
  }
  if (
    (typeof timestamp !== "number" && typeof timestamp !== "string") ||
    timestamp === ""
  ) {
    return res.status(400).json({ ok: false, error: "Missing timestamp" });
  }
  // if (typeof signature !== "string" || !signature.trim()) {
  //   return res.status(400).json({ ok: false, error: "Missing signature" });
  // }

  // Normalize timestamp to number (to avoid "string vs number" signature mismatches)
  const ts =
    typeof timestamp === "string" ? Number(timestamp) : (timestamp as number);

  if (!Number.isFinite(ts)) {
    return res.status(400).json({ ok: false, error: "Invalid timestamp" });
  }

  /* =========================
     🔐 AUTH (HMAC)
  ========================= */
  // const isValid = verifyHmac(userId, text, ts, signature);

  // if (!isValid) {
  //   console.log("🔐 HMAC DEBUG (INVALID)");
  //   console.log("userId:", userId);
  //   console.log("timestamp:", ts, typeof ts);
  //   console.log("text:", text);
  //   console.log("signature (received):", signature);

  //   return res.status(401).json({
  //     ok: false,
  //     error: "INVALID_SIGNATURE",
  //   });
  // }

  // console.log("🧠 User input:", text);
  // console.log("👤 User ID:", userId);

  /* =========================
     🆕 NEW USER CHECK
  ========================= */
  if (!isUserAllowed(userId)) {
    console.log("🆕 New user detected:", userId);
    console.log("📧 User email:", mail ?? "(not provided)");

    // Send notification email (to user if email provided, always to admin)
    await sendNewUserEmail(userId, mail);

    return res.status(403).json({
      ok: false,
      error: "USER_NOT_ALLOWED",
      message: mail
        ? "משתמש חדש - נשלח מייל עם פרטים נוספים"
        : "משתמש חדש - נא לפנות למנהל המערכת",
    });
  }

  // 👤 Auto-register or update user
  const user = await getOrCreateUser(userId);
  console.log("👤 User config:", user.userId, user.name ?? "(no name)");

  const pending = getPendingFollowup(userId);
  console.log("🟡 PENDING FOLLOWUP:", pending);

  try {
    let plan;

    /* =========================
       FOLLOW-UP FLOW
    ========================= */
    if (pending) {
      plan = resolveFollowup(pending, text, userId);

      // Only clear if we got a final action (not asking for more info)
      const hasFinalAction = plan.actions.some(a =>
        a.type === "CREATE_TASK" ||
        a.type === "CREATE_MEETING" ||
        a.type === "SAVE_IDEA"
      );

      if (hasFinalAction) {
        clearPendingFollowup(userId);
      }
      // Otherwise: keep pending state for next turn!
    }

    /* =========================
       NORMAL FLOW
    ========================= */
    else {
      const raw = await parseIntent(text);
      const rawIntent = JSON.parse(extractJson(raw));

      console.log("🤖 Raw intent:", rawIntent);

      plan = await decide(rawIntent);
    }

    console.log("⚙️ Action plan:", plan);

    // 🔑 execute with user context
    await executeActionPlan(plan, { userId });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ ok: false });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
