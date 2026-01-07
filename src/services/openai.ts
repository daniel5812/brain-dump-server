import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseIntent(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
            You are an intent classification engine.

            You MUST return ONLY valid JSON.
            NO explanations. NO text outside JSON.

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
            - The user is recording information or a thought.

            IDEA:
            - The user is expressing a creative or future idea.

            Confidence:
            - Return a number between 0.0 and 1.0 indicating confidence.

            Return one of the following JSON shapes ONLY:

            TASK:
            {
            "type": "task",
            "title": "...",
            "due": "... or null",
            "confidence": 0.0
            }

            NOTE:
            {
            "type": "note",
            "content": "...",
            "confidence": 0.0
            }

            IDEA:
            {
            "type": "idea",
            "content": "...",
            "confidence": 0.0
            }
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content;
}