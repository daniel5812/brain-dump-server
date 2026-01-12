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

dotenv.config();

const app = express();
app.use(express.json());

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

app.post("/brain-dump", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false });
  }

  console.log("🧠 User input:", text);

  const pending = getPendingFollowup();
  console.log("🟡 PENDING FOLLOWUP:", pending);

  try {
    let plan;

    // 🟢 1️⃣ אם יש follow-up פתוח → פותרים אותו
    if (pending) {
      console.log("↩️ Resolving follow-up");

      plan = resolveFollowup(pending, text);
      clearPendingFollowup();
    }

    // 🔵 2️⃣ אחרת → זרימה רגילה (AI)
    else {
      const raw = await parseIntent(text);
      const rawIntent = JSON.parse(extractJson(raw));

      console.log("🤖 Raw intent:", rawIntent);

      plan = await decide(rawIntent);
    }

    console.log("⚙️ Action plan:", plan);

    await executeActionPlan(plan);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
