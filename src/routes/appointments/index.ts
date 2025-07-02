import express from "express";
import {
  getUserAppointments,
  getDoctorAppointments,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  adminUpdateAppointmentStatus
} from "../../controllers/appointmentsController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

// Global protection
router.use(verifyToken);

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Book appointment (user only)
router.post("/", requireRole("user"), asyncHandler(bookAppointment));

// Get user's appointments
router.get("/user", requireRole("user"), asyncHandler(getUserAppointments));

// Get doctor's appointments
router.get("/doctor", requireRole("doctor"), asyncHandler(getDoctorAppointments));

// Update appointment status (doctor only)
router.patch("/:id/status", requireRole("doctor"), asyncHandler(updateAppointmentStatus));

// Cancel appointment (user only)
router.patch("/:id/cancel", requireRole("user"), asyncHandler(cancelAppointment));

// Admin override appointment status (admin only)
router.patch("/:id/override", requireRole("admin"), asyncHandler(adminUpdateAppointmentStatus));

export default router;
