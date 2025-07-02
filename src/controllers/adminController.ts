import { Request, Response } from "express";
import { sum, count, eq, between, and, sql } from "drizzle-orm";
import { db } from "../config/db";
import { users, appointments, prescriptions, payments } from "../models/schema";

export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;
  const dateFilter = from && to
    ? between(payments.created_at, new Date(from as string), new Date(to as string))
    : undefined;

  try {
    // Fetch user and appointment counts
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "user"));
    const [doctorCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "doctor"));
    const [appointmentCount] = await db.select({ count: count() }).from(appointments);
    const [prescriptionCount] = await db.select({ count: count() }).from(prescriptions);
    
    // Fetch revenue filtered by optional date range
    const [revenue] = await db
      .select({ totalRevenue: sum(payments.amount) })
      .from(payments)
      .where(and(eq(payments.payment_status, "succeeded"), ...(dateFilter ? [dateFilter] : [])));

    res.status(200).json({
      totalUsers: userCount.count,
      totalDoctors: doctorCount.count,
      appointments: appointmentCount.count,
      prescriptions: prescriptionCount.count,
      totalRevenue: revenue.totalRevenue ?? 0
    });
  } catch (err) {
    console.error("Analytics fetch failed:", err);
    res.status(500).json({ message: "Failed to retrieve analytics" });
  }
};

export const getDailyRevenue = async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;

  if (!from || !to) {
    res.status(400).json({ message: "Please provide from/to dates" });
    return;
  }

  try {
    const result = await db
      .select({
        date: sql<string>`DATE(${payments.created_at})`.as("date"),
        total: sql<number>`SUM(${payments.amount})`.as("total")
      })
      .from(payments)
      .where(
        between(payments.created_at, new Date(from as string), new Date(to as string))
      )
      .groupBy(sql`DATE(${payments.created_at})`)
      .orderBy(sql`DATE(${payments.created_at})`);

    res.status(200).json(result);
  } catch (err) {
    console.error("Daily revenue fetch failed:", err);
    res.status(500).json({ message: "Could not retrieve daily revenue" });
  }
};
