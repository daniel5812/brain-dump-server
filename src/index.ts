import express from "express";
import dotenv from "dotenv";
import { parseIntent } from "./services/openai";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/brain-dump", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' field" });
  }

  console.log("🧠 Raw input:", text);

  let rawResponse: string | null;
  let intent: any;

  try {
    rawResponse = await parseIntent(text);
    if (!rawResponse) {
      return res.status(500).json({ error: "Empty AI response" });
    }
  } catch (err) {
    console.error("❌ Failed to call OpenAI:", err);
    return res.status(500).json({ error: "AI request failed" });
  }

  try {
    intent = JSON.parse(rawResponse);
  } catch (err) {
    console.error("❌ Invalid JSON from AI:", rawResponse);
    return res.status(500).json({ error: "Invalid AI response format" });
  }

  console.log("🤖 Parsed intent:", intent);

  // ⚠️ בשלב הבא כאן תיכנס שכבת ההחלטה (Decision Layer)

  res.json({
    ok: true,
    intent, // זמני – רק לצורכי בדיקה
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
