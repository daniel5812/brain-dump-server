// src/security/hmac.ts
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.HMAC_SECRET!;

if (!SECRET) {
    throw new Error("Missing HMAC_SECRET");
}

export interface HmacPayload {
    userId: string;
    text: string;
    timestamp: number;
    signature: string;
}

/**
 * Verifies HMAC signature for a request
 */
export function verifyHmac(
    userId: string,
    text: string,
    timestamp: number,
    signature: string
): boolean {
    const message = `${userId}.${timestamp}.${text}`;

    const expected = crypto
        .createHmac("sha256", SECRET)
        .update(message)
        .digest("hex");

    console.log("🔐 HMAC DEBUG");
    console.log("message:", message);
    console.log("expected:", expected);
    console.log("received:", signature);

    return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(signature, "hex")
    );
}
