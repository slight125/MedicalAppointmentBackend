import { Request, Response } from "express";
import { db } from "../config/db";
import { complaints, users } from "../models/schema";
import { eq, inArray } from "drizzle-orm";
import { transporter } from "../utils/mailer";
import { appointments } from "../models/schema";
import { doctors } from "../models/schema";
import { complaint_messages } from "../models/schema";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

// Create a new complaint
export const submitComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { related_appointment_id, subject, description, category, priority } = req.body;
  const user_id = req.user?.user_id;

  if (!subject || !description) {
    res.status(400).json({ message: "Subject and description required" });
    return;
  }

  try {
    await db.insert(complaints).values({
      user_id,
      related_appointment_id,
      subject,
      description,
      category,
      priority,
      status: "Open"
    });

    // Notify all admins about the new complaint
    const admins = await db.query.users.findMany({ 
      where: eq(users.role, "admin") 
    });

    for (const admin of admins) {
      if (admin.email) {
        await transporter.sendMail({
          from: `"Teach2Give Alerts" <${process.env.EMAIL_USER}>`,
          to: admin.email,
          subject: "🆘 New Support Ticket Submitted",
          html: `
            <p>User #${user_id} submitted a new complaint: <strong>${subject}</strong></p>
            <p>Please review it on the admin panel.</p>
          `
        });
      }
    }

    res.status(201).json({ message: "Complaint submitted" });
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({ message: "Could not create complaint" });
  }
};

// Get all complaints (Admin view)
export const getAllComplaints = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    if (page && limit) {
      const offset = (page - 1) * limit;
      const [totalResult] = await db.execute(`SELECT COUNT(*) as count FROM complaints`) as unknown as any[];
      const total = totalResult ? parseInt(totalResult.count, 10) : 0;
      const result = await db.select().from(complaints).limit(limit).offset(offset);
      res.status(200).json({
        complaints: result,
        total,
        page,
        pageSize: limit
      });
    } else {
      // No pagination: return all complaints as a flat array
      const result = await db.select().from(complaints);
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// Update complaint status (Admin)
export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  const complaintId = parseInt(req.params.id);
  const { status } = req.body;

  try {
    await db.update(complaints)
      .set({ status })
      .where(eq(complaints.complaint_id, complaintId));

    // Send email notification if complaint is resolved
    const complaint = await db.query.complaints.findFirst({
      where: eq(complaints.complaint_id, complaintId),
      with: { user: true }
    });

    if (complaint?.status === "Resolved" && complaint?.user?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Support" <${process.env.EMAIL_USER}>`,
        to: complaint.user.email,
        subject: "Your Support Ticket has been Resolved",
        html: `
          <h2>Resolved ✅</h2>
          <p>Hi ${complaint.user.firstname || "User"},</p>
          <p>Your ticket titled <strong>"${complaint.subject}"</strong> has been marked as resolved. Feel free to reach out if anything persists.</p>
        `
      });
    }

    res.status(200).json({ message: "Complaint status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

export const updateComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.user_id;
  const { subject, description } = req.body;
  try {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.complaint_id, parseInt(id)));
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }
    if (complaint.user_id !== userId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    await db.update(complaints)
      .set({ subject, description })
      .where(eq(complaints.complaint_id, parseInt(id)));
    res.status(200).json({ message: 'Complaint updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update complaint' });
  }
};

export const getUserComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.user_id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const result = await db.select().from(complaints).where(eq(complaints.user_id, userId));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
};

export const deleteComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.user_id;
  const userRole = req.user?.role;
  try {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.complaint_id, parseInt(id)));
    if (!complaint) {
      res.status(404).json({ message: "Complaint not found" });
      return;
    }
    if (userRole !== "admin" && complaint.user_id !== userId) {
      console.error(`Delete forbidden: userRole=${userRole}, req.user.user_id=${userId}, complaint.user_id=${complaint.user_id}`);
      res.status(403).json({ message: `Unauthorized: userRole=${userRole}, req.user.user_id=${userId}, complaint.user_id=${complaint.user_id}` });
      return;
    }
    await db.delete(complaints).where(eq(complaints.complaint_id, parseInt(id)));
    res.status(200).json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete complaint" });
  }
};

export const getDoctorComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'doctor') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  try {
    // Find the doctor row for this user
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.user_id, req.user.user_id) });
    if (!doctor) {
      res.status(404).json({ message: 'Doctor profile not found for this user.' });
      return;
    }
    // Find all appointments for this doctor
    const doctorAppointments = await db.select().from(appointments).where(eq(appointments.doctor_id, doctor.doctor_id));
    const appointmentIds = doctorAppointments.map(a => a.appointment_id);
    if (appointmentIds.length === 0) {
      res.status(200).json([]);
      return;
    }
    // Find all complaints for these appointments
    const doctorComplaints = await db
      .select({
        complaint_id: complaints.complaint_id,
        user_id: complaints.user_id,
        related_appointment_id: complaints.related_appointment_id,
        subject: complaints.subject,
        description: complaints.description,
        status: complaints.status,
        category: complaints.category,
        priority: complaints.priority,
        created_at: complaints.created_at,
        updated_at: complaints.updated_at,
        user_name: users.firstname,
        user_email: users.email,
        user_phone: users.contact_phone,
        appointment_date: appointments.appointment_date,
      })
      .from(complaints)
      .leftJoin(appointments, eq(complaints.related_appointment_id, appointments.appointment_id))
      .leftJoin(users, eq(complaints.user_id, users.user_id))
      .where(inArray(complaints.related_appointment_id, appointmentIds));
    res.status(200).json(doctorComplaints);
  } catch (err) {
    console.error('getDoctorComplaints error:', err instanceof Error ? err.stack : err);
    res.status(500).json({ message: 'Failed to fetch doctor complaints' });
  }
};

// Add a message to a complaint
export const addComplaintMessage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const sender_id = req.user?.user_id;
  const sender_role = req.user?.role;
  if (!message) return res.status(400).json({ message: "Message required" });
  await db.insert(complaint_messages).values({
    complaint_id: parseInt(id),
    sender_id,
    sender_role,
    message
  });
  res.status(201).json({ message: "Message added" });
};

// Get all messages for a complaint
export const getComplaintMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const messages = await db.query.complaint_messages.findMany({
      where: eq(complaint_messages.complaint_id, parseInt(id)),
      orderBy: complaint_messages.created_at
    });
    res.json(messages); // Always return array, even if empty
  } catch (err) {
    console.error('getComplaintMessages error:', err);
    res.status(500).json({ message: 'Failed to fetch complaint messages' });
  }
};
