import express from "express";
import dotenv from "dotenv";
import { parseIntent } from "./services/openai";
import { decide } from "./decision/decisionEngine";

dotenv.config();

const app = express();
app.use(express.json());

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No valid JSON object found in AI response");
  }

  return raw.slice(start, end + 1);
}

app.post("/brain-dump", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' field" });
  }

  console.log("🧠 Raw input:", text);

  let rawResponse: string;
  let intent: any;

  try {
    rawResponse = await parseIntent(text);
  } catch (err) {
    console.error("❌ Failed to call OpenAI:", err);
    return res.status(500).json({ error: "AI request failed" });
  }

  try {
    const cleaned = extractJson(rawResponse);
    intent = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Invalid JSON from AI:", rawResponse);
    return res.status(500).json({ error: "Invalid AI response format" });
  }

  console.log("🤖 Parsed intent:", intent);

  let decision;
  try {
    decision = decide(intent);
  } catch (err) {
    console.error("❌ Decision layer error:", err);
    return res.status(500).json({ error: "Decision layer failed" });
  }

  console.log("⚙️ Decision result:", decision);

  // זמני – לצורכי בדיקה בלבד
  res.json({
    ok: true,
    decision,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
