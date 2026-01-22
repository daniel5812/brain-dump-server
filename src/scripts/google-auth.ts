import { google } from "googleapis";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",   // 🔴 חובה בשביל refresh token
    prompt: "consent",        // 🔴 מכריח Google לתת refresh token
    scope: SCOPES,
});

console.log("🔑 Open this URL in your browser:\n");
console.log(authUrl);
console.log("\nPaste the code here:\n");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("> ", async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n✅ TOKENS RECEIVED:\n");
    console.log(tokens);
    console.log("\n🔐 REFRESH TOKEN:\n", tokens.refresh_token);
    rl.close();
});
