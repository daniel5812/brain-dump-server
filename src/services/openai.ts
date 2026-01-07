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
            You receive a short sentence in Hebrew spoken by a user.

            Classify it into one of:
            - task
            - note
            - idea

            If it's a task:
            - extract a short title
            - extract due date if exists (today, tomorrow, date)

            Return ONLY valid JSON.
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
