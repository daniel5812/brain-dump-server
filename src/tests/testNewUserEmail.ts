// Test script for new user email
// Run: npx ts-node src/tests/testNewUserEmail.ts

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SERVER_URL = "http://localhost:3000/brain-dump";
const HMAC_SECRET = process.env.HMAC_SECRET!;

// Test data - user NOT in allowed list
const testData = {
    text: "test message",
    userId: "972999999999",  // Not in allowed list
    mail: "shahar20788@gmail.com",  // Email to receive notification
    timestamp: Math.floor(Date.now() / 1000),
};

// Generate HMAC signature
function generateSignature(userId: string, text: string, timestamp: number): string {
    const message = `${userId}.${timestamp}.${text}`;
    return crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(message)
        .digest("hex");
}

async function test() {
    const signature = generateSignature(testData.userId, testData.text, testData.timestamp);

    console.log("🧪 Testing new user email...");
    console.log("📧 Email will be sent to:", testData.mail);
    console.log("📱 User ID:", testData.userId);

    const body = {
        ...testData,
        signature,
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const result = await response.json();
        console.log("\n📬 Response:", JSON.stringify(result, null, 2));

        if (result.error === "USER_NOT_ALLOWED") {
            console.log("\n✅ Test passed! Check your email for the notification.");
        }
    } catch (error: any) {
        console.error("❌ Error:", error.message);
    }
}

test();
