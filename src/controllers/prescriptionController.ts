import { Request, Response } from "express";
import { db } from "../config/db";
import * as schema from "../models/schema";
import { eq } from "drizzle-orm";

const { prescriptions, appointments, users } = schema;

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const createPrescription = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    appointment_id,
    doctor_id,
    patient_id,
    notes
  } = req.body;

  if (!appointment_id || !doctor_id || !patient_id) {
    res.status(400).json({ message: "Missing prescription fields" });
    return;
  }

  try {
    await db.insert(prescriptions).values({
      appointment_id,
      doctor_id,
      patient_id,
      notes
    });

    res.status(201).json({ message: "Prescription created ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create prescription" });
  }
};

export const getUserPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      res.status(400).json({ message: "User ID is missing" });
      return;
    }

    const result = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        notes: prescriptions.notes,
        appointment_date: appointments.appointment_date,
        doctor_name: users.firstname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.patient_id, user_id));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching user prescriptions:", err);
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};
