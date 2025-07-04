import express from "express";
import { db } from "../../config/db";
import { payments, appointments } from "../../models/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Development webhook tester - simulates successful payment
router.post("/test-payment", express.json(), async (req, res): Promise<void> => {
  const { appointment_id, amount = 50.00 } = req.body;

  if (!appointment_id) {
    res.status(400).json({ error: "appointment_id is required" });
    return;
  }

  try {
    // Simulate a successful payment
    const testPayment = await db.insert(payments).values({
      appointment_id: parseInt(appointment_id),
      amount: amount.toString(),
      transaction_id: `test_txn_${Date.now()}`,
      payment_status: "paid",
      payment_date: new Date().toISOString().split('T')[0]
    }).returning();

    console.log("✅ Test payment created:", testPayment[0]);

    res.status(200).json({
      success: true,
      message: "Test payment processed successfully",
      payment: testPayment[0]
    });
  } catch (error) {
    console.error("❌ Test payment failed:", error);
    res.status(500).json({ error: "Failed to process test payment" });
  }
});

// List all payments for debugging
router.get("/payments", async (req, res): Promise<void> => {
  try {
    const allPayments = await db.query.payments.findMany({
      with: { appointment: true }
    });

    res.status(200).json(allPayments);
  } catch (error) {
    console.error("❌ Failed to fetch payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Test complete payment flow with appointment update
router.post("/complete-payment", express.json(), async (req, res): Promise<void> => {
  const { appointment_id, amount = 50.00 } = req.body;

  if (!appointment_id) {
    res.status(400).json({ error: "appointment_id is required" });
    return;
  }

  try {
    // Insert payment record
    const testPayment = await db.insert(payments).values({
      appointment_id: parseInt(appointment_id),
      amount: amount.toString(),
      transaction_id: `test_complete_${Date.now()}`,
      payment_status: "paid",
      payment_date: new Date().toISOString().split('T')[0]
    }).returning();

    // Mark appointment as paid
    await db.update(appointments)
      .set({ paid: true })
      .where(eq(appointments.appointment_id, parseInt(appointment_id)));

    console.log("✅ Complete payment flow tested:", testPayment[0]);

    res.status(200).json({
      success: true,
      message: "Complete payment flow processed successfully",
      payment: testPayment[0],
      appointment_updated: true
    });
  } catch (error) {
    console.error("❌ Complete payment test failed:", error);
    res.status(500).json({ error: "Failed to process complete payment test" });
  }
});

export default router;
