import express from "express";
import {
  getAppointmentStats,
  getUserAppointments,
  getDoctorAppointments,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  adminUpdateAppointmentStatus,
  adminUpdateAppointmentAmount,
  getAllAppointmentsAdmin,
  getDoctors,
  deleteAppointment
} from "../../controllers/appointmentsController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Public endpoints (before authentication middleware)
// Test public endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Public endpoint working" });
});

// Get available doctors (public endpoint)
router.get("/doctors", asyncHandler(getDoctors));

// Global protection for all other routes
router.use(verifyToken);

// Book appointment (user only)
router.post("/", requireRole("user"), asyncHandler(bookAppointment));

// Get user's appointments
router.get("/user", requireRole("user"), asyncHandler(getUserAppointments));
router.get("/stats", getAppointmentStats);
// Get doctor's appointments
router.get("/doctor", requireRole("doctor"), asyncHandler(getDoctorAppointments));

// Update appointment status (doctor only)
router.patch("/:id/status", requireRole("doctor"), asyncHandler(updateAppointmentStatus));

// Cancel appointment (user only)
router.patch("/:id/cancel", requireRole("user"), asyncHandler(cancelAppointment));

// Admin override appointment status (admin only)
router.patch("/:id/override", requireRole("admin"), asyncHandler(adminUpdateAppointmentStatus));

// Admin update appointment amount (admin only)
router.patch('/:id/amount', requireRole('admin'), asyncHandler(adminUpdateAppointmentAmount));

// Admin get all appointments
router.get('/admin/all', requireRole('admin'), asyncHandler(getAllAppointmentsAdmin));

// Delete appointment (admin, user, or doctor)
router.delete("/:id", asyncHandler(deleteAppointment));

// Get appointments based on user role (general endpoint)
router.get("/", asyncHandler(async (req: any, res: express.Response) => {
  // Route to appropriate controller based on user role
  if (req.user?.role === "doctor") {
    return getDoctorAppointments(req, res);
  } else if (req.user?.role === "user") {
    return getUserAppointments(req, res);
  } else if (req.user?.role === "admin") {
    // Admin can see all appointments - you might want to create a separate controller for this
    return getUserAppointments(req, res); // For now, fallback to user appointments
  } else {
    return res.status(403).json({ message: "Access denied" });
  }
}));
export default router;