import express from "express";
import Stripe from "stripe";
import { db } from "../../config/db";
import { payments, appointments, users } from "../../models/schema";
import { eq } from "drizzle-orm";
import { transporter } from "../../utils/mailer";

// Check if Stripe key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn("Warning: STRIPE_SECRET_KEY not found in environment variables for webhook");
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-06-30.basil"
}) : null;

const router = express.Router();

// Use raw body parsing for Stripe signature check
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res): Promise<void> => {
  if (!stripe) {
    res.status(500).json({ error: "Payment service not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"]!;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle completed session
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const metadata = session.metadata;
    const appointment_id = parseInt(metadata?.appointment_id ?? "0");
    const amount = session.amount_total! / 100;
    const transaction_id = session.payment_intent;
    const payment_status = session.payment_status;

    console.log("🔍 Processing webhook for appointment:", appointment_id);

    if (appointment_id === 0) {
      console.error("❌ Invalid appointment_id in webhook metadata");
      res.status(400).json({ error: "Invalid appointment_id" });
      return;
    }

    try {
      // Insert payment record
      await db.insert(payments).values({
        appointment_id,
        amount: amount.toString(),
        transaction_id: transaction_id as string,
        payment_status: payment_status as string
      });

      console.log("✅ Webhook payment logged:", appointment_id);

      // Mark appointment as paid
      await db.update(appointments)
        .set({ paid: true })
        .where(eq(appointments.appointment_id, appointment_id));

      console.log("✅ Appointment marked as paid:", appointment_id);

      // Fetch appointment details with user information for email
      const [appt] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.appointment_id, appointment_id))
        .leftJoin(users, eq(users.user_id, appointments.user_id));

      // Send confirmation email to user
      if (appt?.users?.email) {
        await transporter.sendMail({
          from: `"Teach2Give Payments" <${process.env.EMAIL_USER}>`,
          to: appt.users.email,
          subject: "Payment & Appointment Confirmed ✅",
          html: `
            <h2>Appointment Confirmed!</h2>
            <p>Hi ${appt.users.firstname || "User"},</p>
            <p>We've received your payment of <strong>$${amount}</strong> for appointment #${appointment_id}.</p>
            <p><strong>Appointment Details:</strong></p>
            <ul>
              <li>Date: ${appt.appointments?.appointment_date}</li>
              <li>Time: ${appt.appointments?.time_slot}</li>
              <li>Doctor ID: ${appt.appointments?.doctor_id}</li>
              <li>Status: ${appt.appointments?.appointment_status}</li>
            </ul>
            <p>Your booking is now confirmed and paid. We look forward to seeing you!</p>
            <p>Thank you for using Teach2Give!</p>
            <hr>
            <p><small>Transaction ID: ${transaction_id}</small></p>
          `
        });

        console.log("✅ Confirmation email sent to:", appt.users.email);
      } else {
        console.log("⚠️ No user email found for appointment:", appointment_id);
      }

    } catch (err) {
      console.error("❌ Webhook processing failed:", err);
    }
  }

  res.json({ received: true });
});

export default router;
