// src/services/email/emailSender.ts
// Email sending service

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// ===========================
// CONFIGURATION
// ===========================

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "daniel5810005@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "";  // App Password
const SENDER_EMAIL = process.env.SENDER_EMAIL || "daniel5810005@gmail.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "daniel5810005@gmail.com";

// ===========================
// TRANSPORTER
// ===========================

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// ===========================
// TEMPLATE LOADING
// ===========================

/**
 * Load HTML template and replace placeholders
 */
function loadTemplate(
    templateName: string,
    variables: Record<string, string>
): string {
    const templatePath = path.join(
        __dirname,
        "templates",
        `${templateName}.html`
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace all {{VARIABLE}} placeholders
    for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return html;
}

// ===========================
// SEND FUNCTIONS
// ===========================

export interface EmailResult {
    ok: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send email with HTML body
 */
export async function sendEmail(
    to: string,
    subject: string,
    htmlBody: string
): Promise<EmailResult> {
    if (!SMTP_PASS) {
        console.warn("⚠️ SMTP_PASS not configured, skipping email");
        return { ok: false, error: "SMTP not configured" };
    }

    try {
        const info = await transporter.sendMail({
            from: SENDER_EMAIL,
            to,
            subject,
            html: htmlBody,
        });

        console.log("✅ Email sent:", info.messageId);
        return { ok: true, messageId: info.messageId };

    } catch (error: any) {
        console.error("❌ Email failed:", error.message);
        return { ok: false, error: error.message };
    }
}

/**
 * Send new user notification email
 */
export async function sendNewUserEmail(
    userPhone: string,
    userEmail?: string
): Promise<EmailResult> {
    const html = loadTemplate("newUser", {
        USER_NAME: userPhone,
        USER_PHONE: userPhone,
        DATE: new Date().toLocaleDateString("he-IL"),
    });

    // Send to admin (notification)
    await sendEmail(
        ADMIN_EMAIL,
        `🆕 משתמש חדש: ${userPhone}`,
        html
    );

    // If user provided email, send to them too
    if (userEmail) {
        return sendEmail(
            userEmail,
            "ברוכים הבאים ל-Brain Dump! 🧠",
            html
        );
    }

    return { ok: true };
}
