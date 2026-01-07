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
    throw new Error("Invalid JSON from AI");
  }

  return raw.slice(start, end + 1);
}

app.post("/brain-dump", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false });
  }

  console.log("🧠 Raw input:", text);

  try {
    const raw = await parseIntent(text);
    const intent = JSON.parse(extractJson(raw));

    console.log("🤖 Parsed intent:", intent);

    const decision = await decide(intent);
    console.log("⚙️ Decision:", decision);

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
