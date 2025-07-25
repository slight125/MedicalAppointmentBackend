import { Request, Response } from "express";
import { sum, count, eq, between, and, sql, ilike, or } from "drizzle-orm";
import { db } from "../config/db";
import { users, appointments, prescriptions, payments, doctors } from "../models/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

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

export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get all users with basic information
    const allUsers = await db
      .select({
        user_id: users.user_id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        contact_phone: users.contact_phone,
        address: users.address,
        created_at: users.created_at
      })
      .from(users)
      .orderBy(users.created_at);

    res.status(200).json({
      success: true,
      message: "Users displayed successfully",
      data: allUsers,
      count: allUsers.length
    });
  } catch (error) {
    console.error("Get all users failed:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve users",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [user] = await db
      .select({
        user_id: users.user_id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        contact_phone: users.contact_phone,
        address: users.address,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users)
      .where(eq(users.user_id, parseInt(id)));

    if (!user) {
      res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { firstname, lastname, email, role, contact_phone, address } = req.body;

  try {
    const [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.user_id, parseInt(id)));

    if (!userExists) {
      res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
      return;
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (address !== undefined) updateData.address = address;
    updateData.updated_at = new Date();

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.user_id, parseInt(id)));

    res.status(200).json({ 
      success: true,
      message: "User updated successfully" 
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.user_id, parseInt(id)));

    if (!userExists) {
      res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
      return;
    }

    await db
      .delete(users)
      .where(eq(users.user_id, parseInt(id)));

    res.status(200).json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    res.status(400).json({ 
      success: false,
      message: "Please provide a valid search query" 
    });
    return;
  }

  try {
    // Search users by firstname, lastname, or email
    const results = await db
      .select({
        user_id: users.user_id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        contact_phone: users.contact_phone,
        created_at: users.created_at
      })
      .from(users)
      .where(
        or(
          ilike(users.firstname, `%${query}%`),
          ilike(users.lastname, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .orderBy(users.firstname, users.lastname);

    res.status(200).json({
      success: true,
      message: `Found ${results.length} users matching "${query}"`,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to search users",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// --- DOCTOR CRUD ---
export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  const { first_name, last_name, specialization, contact_phone, available_days } = req.body;
  if (!first_name || !last_name || !specialization || !contact_phone) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }
  try {
    const [doctor] = await db.insert(doctors).values({
      first_name,
      last_name,
      specialization,
      contact_phone,
      available_days,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    res.status(201).json({ success: true, message: "Doctor created", doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create doctor", error });
  }
};

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { first_name, last_name, specialization, contact_phone, available_days } = req.body;
  try {
    const [doctorExists] = await db.select().from(doctors).where(eq(doctors.doctor_id, parseInt(id)));
    if (!doctorExists) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (available_days !== undefined) updateData.available_days = available_days;
    updateData.updated_at = new Date();
    await db.update(doctors).set(updateData).where(eq(doctors.doctor_id, parseInt(id)));
    res.status(200).json({ success: true, message: "Doctor updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update doctor", error });
  }
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [doctorExists] = await db.select().from(doctors).where(eq(doctors.doctor_id, parseInt(id)));
    if (!doctorExists) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }
    await db.delete(doctors).where(eq(doctors.doctor_id, parseInt(id)));
    res.status(200).json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete doctor", error });
  }
};
