import express from "express";
import { createPaymentSession, confirmPayment } from "../../controllers/paymentController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();
router.use(verifyToken);

// Create Stripe session
router.post("/create", requireRole("user"), createPaymentSession);

// ✅ Add this route!
router.post("/confirm", requireRole("user"), confirmPayment);

export default router;
