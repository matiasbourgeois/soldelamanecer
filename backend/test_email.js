require('dotenv').config();
const nodemailer = require("nodemailer");

async function test() {
    console.log("Testing email with config:", {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER
    });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: "matiasbourgeois@gmail.com", // testing with user's email or mine? Better user's or just a dummy
            subject: "Test Antigravity",
            text: "Probando envio de mail desde backend local",
            html: "<b>Probando envio de mail desde backend local</b>",
        });
        console.log("✅ Email sent:", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

test();
