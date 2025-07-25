import { Request, Response } from "express";
import { db } from "../config/db";
import { complaints, users } from "../models/schema";
import { eq } from "drizzle-orm";
import { transporter } from "../utils/mailer";

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
export const getAllComplaints = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select().from(complaints);
    res.status(200).json(result);
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
