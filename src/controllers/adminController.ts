import { Request, Response } from "express";
import { db } from "../config/db";
import { users, appointments, prescriptions } from "../models/schema";
import { count, eq } from "drizzle-orm";

export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await db.select({ count: count() }).from(users).where(eq(users.role, "user"));
    const totalDoctors = await db.select({ count: count() }).from(users).where(eq(users.role, "doctor"));
    const totalAppointments = await db.select({ count: count() }).from(appointments);
    const prescriptionsIssued = await db.select({ count: count() }).from(prescriptions);

    res.status(200).json({
      totalUsers: totalUsers[0].count,
      totalDoctors: totalDoctors[0].count,
      appointments: totalAppointments[0].count,
      prescriptions: prescriptionsIssued[0].count
    });
  } catch (err) {
    console.error("Analytics fetch failed:", err);
    res.status(500).json({ message: "Failed to retrieve analytics" });
  }
};
