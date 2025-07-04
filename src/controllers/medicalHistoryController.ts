import { Request, Response } from "express";
import { db } from "../config/db";
import * as schema from "../models/schema";
import { eq } from "drizzle-orm";

const { prescriptions, appointments, users, doctors } = schema;

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const getSelfMedicalHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.user_id;

  if (!userId) {
    res.status(401).json({ message: "User authentication required" });
    return;
  }

  try {
    const appointmentsData = await db.query.appointments.findMany({
      where: eq(appointments.user_id, userId),
      with: { doctor: true }
    });

    const prescriptionsData = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patient_id, userId),
      with: { appointment: true, doctor: true }
    });

    res.status(200).json({
      appointments: appointmentsData,
      prescriptions: prescriptionsData
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: "Failed to retrieve medical history" });
  }
};

export const getUserMedicalHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const requestingUserId = req.user?.user_id;
  const userRole = req.user?.role;

  if (!requestingUserId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: "Valid user ID is required" });
    return;
  }

  try {
    // Check if user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.user_id, parseInt(userId)));

    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const appointmentsData = await db.query.appointments.findMany({
      where: eq(appointments.user_id, parseInt(userId)),
      with: { doctor: true }
    });

    const prescriptionsData = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patient_id, parseInt(userId)),
      with: { appointment: true, doctor: true }
    });

    res.status(200).json({
      user: {
        user_id: targetUser.user_id,
        firstname: targetUser.firstname,
        lastname: targetUser.lastname,
        email: targetUser.email
      },
      appointments: appointmentsData,
      prescriptions: prescriptionsData
    });
  } catch (err) {
    console.error("Medical history error:", err);
    res.status(500).json({ message: "Failed to retrieve medical history" });
  }
};
