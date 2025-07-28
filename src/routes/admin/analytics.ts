import express from "express";
import { 
  getAdminSummaryAnalytics,
  getBookingTrends,
  getTopDoctors,
  getRevenueAnalytics,
  getAppointmentStatusBreakdown,
  // getTopDiagnoses,
  // getRevenueByDoctor,
  // getTicketResolutionStats
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

// router.get('/top-diagnoses', verifyToken, allowRoles('admin'), getTopDiagnoses);
// router.get('/revenue-by-doctor', verifyToken, allowRoles('admin'), getRevenueByDoctor);
// router.get('/ticket-resolution-time', verifyToken, allowRoles('admin'), getTicketResolutionStats);

export default router;
