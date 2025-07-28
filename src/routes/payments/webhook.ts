import express, { Request, Response } from "express";
import Stripe from 'stripe';
import { db } from '../../config/db';
import { payments, appointments } from '../../models/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      
      // Update payment status in database
      try {
        await db.update(payments)
          .set({ 
            payment_status: 'completed',
            updated_at: new Date()
          })
          .where(eq(payments.transaction_id, paymentIntent.id));
        
        // Update appointment status if payment is for an appointment
        const payment = await db.query.payments.findFirst({
          where: eq(payments.transaction_id, paymentIntent.id)
        });
        
        if (payment && payment.appointment_id) {
          await db.update(appointments)
            .set({ 
              appointment_status: 'Confirmed',
              updated_at: new Date()
            })
            .where(eq(appointments.appointment_id, payment.appointment_id));
        }
        
        console.log('Payment and appointment status updated successfully');
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed!', failedPaymentIntent.id);
      
      // Update payment status to failed
      try {
        await db.update(payments)
          .set({ 
            payment_status: 'failed',
            updated_at: new Date()
          })
          .where(eq(payments.transaction_id, failedPaymentIntent.id));
      } catch (error) {
        console.error('Error updating failed payment status:', error);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
