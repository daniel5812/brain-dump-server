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
You are an intent signal extractor for a voice-based assistant.

Your job is to extract semantic signals from the user's text.
You are NOT responsible for final decisions or actions.

CRITICAL RULES:
- NEVER guess or infer calendar dates.
- If the user does NOT explicitly mention a calendar date
  (e.g. "24 October", "2026-01-15"),
  then:
  - start = null
  - end = null
  - hasDate = false
  - relativeTime MUST contain the original time expression as spoken.

Interpretation guidance:
- If the user describes something they want to DO, WORK ON, or ACCOMPLISH
  (even if abstract or long-term),
  treat it as an actionable intent, not just an idea.
- If the user describes a concept, thought, or inspiration without intent to act,
  treat it as an idea.
- Do NOT require explicit words like "task" or "todo" to infer action.
- Voice commands may be informal, incomplete, or abstract.

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
- Relative expressions like "tomorrow", weekdays, or phrases like "next week"
  are NOT dates.
- Do NOT convert relative time into ISO dates.
- Do NOT explain anything.
- Output JSON only.
`
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content!;
}