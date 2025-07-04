import { Request, Response } from "express";
import { db } from "../config/db";
import * as schema from "../models/schema";
import { eq, gte, desc, sql } from "drizzle-orm";

const { users, appointments, payments, doctors } = schema;

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const getAdminSummaryAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get total counts
    const totalUsers = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const totalDoctors = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.role, "doctor"));
    const totalAppointments = await db.select({ count: sql<number>`COUNT(*)` }).from(appointments);
    const totalPayments = await db.select({ count: sql<number>`COUNT(*)` }).from(payments);

    // Calculate total revenue
    const paymentsSum = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`
    }).from(payments);

    // Get recent appointments
    const recentAppointments = await db
      .select({
        appointment_id: appointments.appointment_id,
        appointment_date: appointments.appointment_date,
        time_slot: appointments.time_slot,
        appointment_status: appointments.appointment_status,
        patient_name: users.firstname,
        patient_lastname: users.lastname,
        total_amount: appointments.total_amount,
        paid: appointments.paid
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.user_id, users.user_id))
      .orderBy(desc(appointments.created_at))
      .limit(5);

    res.status(200).json({
      totals: {
        users: totalUsers[0]?.count || 0,
        doctors: totalDoctors[0]?.count || 0,
        appointments: totalAppointments[0]?.count || 0,
        payments: totalPayments[0]?.count || 0,
        revenue: paymentsSum[0]?.revenue || 0
      },
      recentAppointments: recentAppointments.map(appt => ({
        ...appt,
        patient_full_name: `${appt.patient_name || ''} ${appt.patient_lastname || ''}`.trim()
      }))
    });
  } catch (err) {
    console.error("Analytics summary error:", err);
    res.status(500).json({ message: "Failed to fetch analytics summary" });
  }
};

export const getBookingTrends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.range as string) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        date: sql<string>`DATE(${appointments.appointment_date})`,
        count: sql<number>`COUNT(*)`
      })
      .from(appointments)
      .where(gte(appointments.appointment_date, since.toISOString().split('T')[0]))
      .groupBy(sql`DATE(${appointments.appointment_date})`)
      .orderBy(sql`DATE(${appointments.appointment_date})`);

    res.status(200).json(results);
  } catch (err) {
    console.error("Booking trends error:", err);
    res.status(500).json({ message: "Failed to fetch booking trends" });
  }
};

export const getTopDoctors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await db
      .select({
        doctor_id: appointments.doctor_id,
        doctor_name: users.firstname,
        doctor_lastname: users.lastname,
        appointment_count: sql<number>`COUNT(*)`
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.doctor_id, users.user_id))
      .groupBy(appointments.doctor_id, users.firstname, users.lastname)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const formattedData = data.map(item => ({
      doctor_id: item.doctor_id,
      doctor_name: `${item.doctor_name || ''} ${item.doctor_lastname || ''}`.trim() || 'Unknown Doctor',
      appointment_count: item.appointment_count
    }));

    res.status(200).json(formattedData);
  } catch (err) {
    console.error("Top doctors error:", err);
    res.status(500).json({ message: "Failed to fetch top doctors" });
  }
};

export const getRevenueAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.range as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily revenue
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${payments.created_at})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`
      })
      .from(payments)
      .where(gte(payments.created_at, since))
      .groupBy(sql`DATE(${payments.created_at})`)
      .orderBy(sql`DATE(${payments.created_at})`);

    // Payment status breakdown
    const paymentStatus = await db
      .select({
        status: payments.payment_status,
        count: sql<number>`COUNT(*)`,
        total_amount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`
      })
      .from(payments)
      .groupBy(payments.payment_status);

    res.status(200).json({
      dailyRevenue,
      paymentStatus
    });
  } catch (err) {
    console.error("Revenue analytics error:", err);
    res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
};

export const getAppointmentStatusBreakdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const statusBreakdown = await db
      .select({
        status: appointments.appointment_status,
        count: sql<number>`COUNT(*)`
      })
      .from(appointments)
      .groupBy(appointments.appointment_status);

    const paidBreakdown = await db
      .select({
        paid_status: sql<string>`CASE WHEN ${appointments.paid} THEN 'Paid' ELSE 'Unpaid' END`,
        count: sql<number>`COUNT(*)`
      })
      .from(appointments)
      .groupBy(sql`CASE WHEN ${appointments.paid} THEN 'Paid' ELSE 'Unpaid' END`);

    res.status(200).json({
      statusBreakdown,
      paidBreakdown
    });
  } catch (err) {
    console.error("Appointment status breakdown error:", err);
    res.status(500).json({ message: "Failed to fetch appointment status breakdown" });
  }
};
