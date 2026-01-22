import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Loads a prompt markdown file from /prompts directory
 * Works correctly in both src/ and dist/
 */
function loadPrompt(filename: string): string {
  const promptPath = path.join(
    __dirname,
    "../../prompts",
    filename
  );

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  return fs.readFileSync(promptPath, "utf-8").trim();
}

/**
 * Parses user text to extract intent signals using GPT
 */
export async function parseIntent(
  text: string,
  promptFile: string = "prompt.md"
): Promise<string> {
  const systemPrompt = loadPrompt(promptFile);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}
