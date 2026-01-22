import fs from "fs";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const TOKENS_DIR = path.join(process.cwd(), "tokens");

function ensureTokensDir() {
  if (!fs.existsSync(TOKENS_DIR)) {
    fs.mkdirSync(TOKENS_DIR);
  }
}

function getTokenPath(userId: string) {
  return path.join(TOKENS_DIR, `${userId}.json`);
}

function createOAuthClient() {
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
  console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * ✅ Multi-user Google OAuth client
 */
export async function getGoogleAuthClient(userId: string) {
  ensureTokensDir();

  const oauth2Client = createOAuthClient();
  const tokenPath = getTokenPath(userId);

  // 🟢 יש טוקן למשתמש
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    oauth2Client.setCredentials(token);
    return oauth2Client;
  }

  // 🔴 אין טוקן → צריך חיבור
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId, // קריטי ל-multi-user
  });

  const error: any = new Error("GOOGLE_AUTH_REQUIRED");
  error.authUrl = authUrl;
  error.userId = userId;
  throw error;
}
