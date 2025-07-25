import express from "express";
import { createPaymentSession, confirmPayment, getPaymentHistory, getPaymentByAppointment, updatePayment, deletePayment } from "../../controllers/paymentController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { db } from '../../config/db';

const router = express.Router();
router.use(verifyToken);

// Create Stripe session
router.post("/create", requireRole("user"), createPaymentSession);

// Confirm payment
router.post("/confirm", requireRole("user"), confirmPayment);

// Get payment history
router.get("/history", requireRole("user"), getPaymentHistory);

// Get payment by appointment ID
router.get("/appointment/:appointmentId", requireRole("user"), getPaymentByAppointment);

// Payment receipt endpoint (PDF)
router.get('/:id/receipt', requireRole('user'), async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch payment details from DB
    const payment = await db.query.payments.findFirst({
      where: (p) => p.payment_id === parseInt(id),
      with: { appointment: true }
    });
    if (!payment) {
      res.status(404).send('Payment not found');
      return;
    }
    // Generate PDF
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payment_receipt_${payment.payment_id}.pdf`);
      res.send(pdfBuffer);
    });
    // Branding/Header
    doc.fontSize(24).fillColor('#2563eb').text('MediCare Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('black').text(`Thank you for your payment!`, { align: 'center' });
    doc.moveDown(2);
    // Payment Details
    doc.fontSize(16).fillColor('#22223b').text('Payment Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    doc.text(`Payment ID: ${payment.payment_id}`);
    doc.text(`Appointment ID: ${payment.appointment_id}`);
    doc.text(`Amount: $${payment.amount}`);
    doc.text(`Status: ${payment.payment_status}`);
    doc.text(`Transaction ID: ${payment.transaction_id}`);
    doc.text(`Date: ${payment.payment_date || payment.created_at}`);
    doc.moveDown();
    // Footer
    doc.fontSize(10).fillColor('gray').text('MediCare - Your trusted medical appointment system', { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).send('Failed to generate receipt');
  }
});

// Update payment (admin only)
router.patch("/:id", requireRole("admin"), updatePayment);
// Delete payment (admin only)
router.delete("/:id", requireRole("admin"), deletePayment);

export default router;
