import { Request, Response } from "express";
import { db } from "../config/db";
import { appointments, users } from "../models/schema";
import { eq } from "drizzle-orm";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const bookAppointment = async (req: Request, res: Response) => {
  const {
    user_id,
    doctor_id,
    appointment_date,
    time_slot,
    total_amount
  } = req.body;

  if (!user_id || !doctor_id || !appointment_date || !time_slot) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await db.insert(appointments).values({
      user_id,
      doctor_id,
      appointment_date,
      time_slot,
      total_amount,
      appointment_status: "Pending"
    });

    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not book appointment" });
  }
};

// View appointments for logged-in user
export const getUserAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (user_id === undefined) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const userAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.user_id, user_id));

    res.status(200).json(userAppointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// Doctor view of their bookings
export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const doctor_id = req.user?.user_id;

    if (doctor_id === undefined) {
      return res.status(400).json({ message: "Doctor ID is missing" });
    }

    const result = await db
      .select({
        appointment_id: appointments.appointment_id,
        appointment_date: appointments.appointment_date,
        time_slot: appointments.time_slot,
        status: appointments.appointment_status,
        patient_name: users.firstname,
        patient_email: users.email,
        patient_phone: users.contact_phone
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.user_id, users.user_id))
      .where(eq(appointments.doctor_id, doctor_id));

    res.status(200).json(result);
  } catch (err) {
    console.error("Doctor appointment fetch failed:", err);
    res.status(500).json({ message: "Could not fetch appointments" });
  }
};
