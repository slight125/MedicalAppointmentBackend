import express, { Request, Response } from "express";
import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "../../controllers/appointmentsController";
import { db } from "../../config/db";
import { appointments, prescriptions, users, payments, doctors } from "../../models/schema";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";
import { and, eq, gte, lt, inArray } from "drizzle-orm";
import { updateDoctorFee } from '../../controllers/appointmentsController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// All routes here require valid JWT
router.use(verifyToken);

// Doctor-only dashboard
router.get("/dashboard", requireRole("doctor"), (req, res) => {
  res.json({
    message: "Welcome Doctor 👨‍⚕️",
    patientsToday: 12,
    unreadMessages: 3,
  });
});

// Dynamic notifications endpoint
router.get("/notifications", verifyToken, requireRole("doctor"), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.user_id;
  
  // First get the doctor profile for this user
  const doctor = await db.query.doctors.findFirst({ 
    where: eq(doctors.user_id, userId) 
  });
  
  if (!doctor) {
    res.status(404).json({ message: 'Doctor profile not found' });
    return;
  }
  
  const doctorId = doctor.doctor_id;
  const today = new Date().toISOString().slice(0, 10);
  
  // Emergency appointments for today (removed invalid type filter)
  const emergencies = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctor_id, doctorId),
      eq(appointments.appointment_date, today)
    ),
    with: { user: true }
  });
  
  // Missed appointments (scheduled before now, not completed/cancelled)
  const now = new Date();
  const missed = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctor_id, doctorId),
      lt(appointments.appointment_date, today),
      eq(appointments.appointment_status, "Pending")
    ),
    with: { user: true }
  });
  
  // Example: Lab results ready (stub)
  const labResults = [
    { message: "3 patients have new results" }
  ];
  res.json({ emergencies, missed, labResults });
});

// Dynamic performance metrics endpoint
router.get("/performance", verifyToken, requireRole("doctor"), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.user_id;
  
  // First get the doctor profile for this user
  const doctor = await db.query.doctors.findFirst({ 
    where: eq(doctors.user_id, userId) 
  });
  
  if (!doctor) {
    res.status(404).json({ message: 'Doctor profile not found' });
    return;
  }
  
  const doctorId = doctor.doctor_id;
  
  // Patients seen this week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
  
  // Get appointments for this week
  const seenAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctor_id, doctorId),
      gte(appointments.appointment_date, startOfWeekStr),
      eq(appointments.appointment_status, "Completed")
    )
  });
  const patientsSeen = seenAppointments.length;
  
  // Revenue for this week
  const doctorAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctor_id, doctorId),
      gte(appointments.appointment_date, startOfWeekStr)
    )
  });
  const appointmentIds = doctorAppointments.map(a => a.appointment_id);
  let revenue = 0;
  if (appointmentIds.length > 0) {
    const paymentRows = await db.query.payments.findMany({
      where: inArray(payments.appointment_id, appointmentIds)
    });
    revenue = paymentRows.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }
  
  // Average consultation time (stub: 25 min per appointment)
  const avgConsultation = 25;
  
  res.json({ patientsSeen, revenue, avgConsultation });
});

// PATCH doctor fee
router.patch('/:doctor_id/fee', verifyToken, requireRole(['admin', 'doctor']), asyncHandler(async (req, res, next) => {
  await updateDoctorFee(req as import('../../controllers/appointmentsController').AuthenticatedRequest, res as import('express').Response);
}));

// Get doctor profile by user_id
router.get('/profile-by-user/:user_id', asyncHandler(async (req, res, next) => {
  const { user_id } = (req as import('express').Request).params;
  const doctor = await db.query.doctors.findFirst({ where: eq(doctors.user_id, Number(user_id)) });
  (res as import('express').Response).json(doctor);
}));

export default router;
