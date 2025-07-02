import Stripe from "stripe";
import { Request, Response } from "express";
import { db } from "../config/db";
import { payments, users, appointments } from "../models/schema";
import { eq } from "drizzle-orm";
import { transporter } from "../utils/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil"
});

export const createPaymentSession = async (req: Request, res: Response): Promise<void> => {
  const { appointment_id, amount } = req.body;

  if (!appointment_id || !amount) {
    res.status(400).json({ message: "Appointment and amount required" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Medical Appointment"
          },
          unit_amount: amount * 100 // cents
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: "http://localhost:3000/payment-success",
      cancel_url: "http://localhost:3000/payment-cancel"
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: "Payment session failed" });
  }
};

// Save Stripe payment result to DB
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  const { appointment_id, amount, transaction_id, payment_status } = req.body;

  if (!appointment_id || !transaction_id || !payment_status) {
    res.status(400).json({ message: "Missing payment fields" });
    return;
  }

  try {
    await db.insert(payments).values({
      appointment_id,
      amount,
      transaction_id,
      payment_status,
    });

    // Send email notification after saving payment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.appointment_id, appointment_id),
      with: { user: true }
    });

    if (appointment?.user?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: appointment.user.email,
        subject: "Payment Confirmation",
        html: `
          <h2>Payment Received ✅</h2>
          <p>Your payment of <strong>Ksh ${amount}</strong> for appointment #${appointment_id} has been confirmed.</p>
          <p>Thank you for using Teach2Give!</p>
        `
      });
    }

    res.status(201).json({ message: "Payment saved successfully ✅" });
  } catch (error) {
    console.error("Payment save failed:", error);
    res.status(500).json({ message: "Failed to save payment" });
  }
};
