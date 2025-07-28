import Stripe from "stripe";
import { Request, Response } from "express";
import { db } from "../config/db";
import { payments, users, appointments } from "../models/schema";
import { eq } from "drizzle-orm";
import { transporter } from "../utils/mailer";

// Check if Stripe key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn("Warning: STRIPE_SECRET_KEY not found in environment variables");
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-06-30.basil"
}) : null;

export const createPaymentSession = async (req: Request, res: Response): Promise<void> => {
  const { appointment_id, amount } = req.body;

  if (!appointment_id || !amount) {
    res.status(400).json({ message: "Appointment and amount required" });
    return;
  }

  if (!stripe) {
    res.status(500).json({ message: "Payment service not configured" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "kes",
          product_data: {
            name: "Medical Appointment Payment",
            description: `Payment for appointment #${appointment_id}`
          },
          unit_amount: amount * 100 // cents
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointment_id}&amount=${amount}`,
      cancel_url: `http://localhost:5173/payment-cancel?appointment_id=${appointment_id}`,
      metadata: {
        appointment_id: appointment_id.toString()
      }
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
    // Convert appointment_id to integer if it's a string
    const appointmentId = typeof appointment_id === 'string' ? parseInt(appointment_id) : appointment_id;
    
    // Validate that appointment_id is a valid integer
    if (isNaN(appointmentId)) {
      res.status(400).json({ message: "Invalid appointment_id format" });
      return;
    }

    await db.insert(payments).values({
      appointment_id: appointmentId,
      amount: String(amount),
      transaction_id,
      payment_status,
    });

    // Send email notification after saving payment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.appointment_id, appointmentId),
      with: { user: true }
    });

    if (appointment?.user?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: appointment.user.email,
        subject: "Payment Confirmation",
        html: `
          <h2>Payment Received ✅</h2>
          <p>Your payment of <strong>Ksh ${amount}</strong> for appointment #${appointmentId} has been confirmed.</p>
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

// Get payment history for a user
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userPayments = await db.query.payments.findMany({
      with: {
        appointment: {
          with: {
            user: true,
            doctor: true
          }
        }
      },
      orderBy: (payments, { desc }) => [desc(payments.created_at)]
    });

    // Filter payments for the authenticated user
    const filteredPayments = userPayments.filter(payment => 
      payment.appointment?.user?.user_id === userId
    );

    res.status(200).json(filteredPayments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

// Get payment by appointment ID
export const getPaymentByAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const payment = await db.query.payments.findFirst({
      where: eq(payments.appointment_id, parseInt(appointmentId)),
      with: {
        appointment: {
          with: {
            user: true,
            doctor: true
          }
        }
      }
    });

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    // Check if the payment belongs to the authenticated user
    if (payment.appointment?.user?.user_id !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment by appointment:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { amount, payment_status } = req.body;
  try {
    const [payment] = await db.select().from(payments).where(eq(payments.payment_id, parseInt(id)));
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    await db.update(payments).set(updateData).where(eq(payments.payment_id, parseInt(id)));
    res.status(200).json({ message: "Payment updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update payment" });
  }
};

export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [payment] = await db.select().from(payments).where(eq(payments.payment_id, parseInt(id)));
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }
    await db.delete(payments).where(eq(payments.payment_id, parseInt(id)));
    res.status(200).json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
