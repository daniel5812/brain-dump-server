import express from "express";
import dotenv from "dotenv";
import { parseIntent } from "./services/openai";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/brain-dump", async (req, res) => {
  const { text } = req.body;

  console.log("🧠 Raw input:", text);

  const intent = await parseIntent(text);

  console.log("🤖 Parsed intent:", intent);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
