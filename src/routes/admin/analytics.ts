import express from "express";
import { 
  getAdminSummaryAnalytics,
  getBookingTrends,
  getTopDoctors,
  getRevenueAnalytics,
  getAppointmentStatusBreakdown
} from "../../controllers/analyticsController";
import { verifyToken, allowRoles } from "../../middleware/authMiddleware";

const router = express.Router();

// Admin summary analytics
router.get("/summary", verifyToken, allowRoles("admin"), getAdminSummaryAnalytics);

// Booking trends (with optional range parameter)
router.get("/bookings", verifyToken, allowRoles("admin"), getBookingTrends);

// Top performing doctors
router.get("/top-doctors", verifyToken, allowRoles("admin"), getTopDoctors);

// Revenue analytics
router.get("/revenue", verifyToken, allowRoles("admin"), getRevenueAnalytics);

// Appointment status breakdown
router.get("/appointment-status", verifyToken, allowRoles("admin"), getAppointmentStatusBreakdown);

export default router;
