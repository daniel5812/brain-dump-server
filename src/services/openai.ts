import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function parseIntent(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are an intent signal extractor.

CRITICAL RULES:
- NEVER guess or infer calendar dates.
- If the user does NOT explicitly mention a calendar date
  (e.g. "24 October", "2026-01-15"),
  then:
  - start = null
  - end = null
  - hasDate = false
  - relativeTime MUST contain the original time expression.

Return ONE JSON object with this exact schema:

{
  "hypothesis": "task" | "meeting" | "idea",
  "title": string,
  "start": string | null,
  "end": string | null,
  "due": string | null,
  "relativeTime": string | null,
  "confidence": number,
  "signals": {
    "hasDate": boolean,
    "hasTime": boolean,
    "hasTimeRange": boolean
  }
}

Additional rules:
- "tomorrow", weekdays, or phrases like "next week" are NOT dates.
- Do NOT convert relative time into ISO dates.
- Do NOT explain anything.
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content!;
}