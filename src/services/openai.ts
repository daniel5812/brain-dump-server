import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseIntent(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are an intent classification engine.

You MUST return ONLY valid JSON.
NO explanations.
NO markdown.
NO text outside JSON.

Classify the user's Hebrew sentence into exactly ONE of:
- "task"
- "note"
- "idea"

Rules:

TASK:
- The user wants to DO something.
- Extract a short actionable title.
- Extract due date if mentioned (e.g. "today", "tomorrow", specific date).
- If no due date, set "due" to null.

NOTE:
- The user is recording information or a fact.

IDEA:
- The user is expressing a creative or future idea.

Return EXACTLY one of the following JSON shapes.

TASK:
{
  "type": "task",
  "title": "string",
  "due": "string or null",
  "confidence": number
}

NOTE:
{
  "type": "note",
  "content": "string",
  "confidence": number
}

IDEA:
{
  "type": "idea",
  "content": "string",
  "confidence": number
}
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}