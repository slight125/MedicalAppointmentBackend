import express from "express";
import { transporter } from "../utils/mailer";
const router = express.Router();

router.get("/email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Teach2Give Tester" <${process.env.EMAIL_USER}>`,
      to: "your_email@example.com",
      subject: "🚀 Nodemailer Test Email",
      html: "<h3>Success! Your email service is working 🎉</h3>"
    });

    res.status(200).json({ message: "Test email sent successfully" });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ message: "Failed to send test email" });
  }
});

export default router;
