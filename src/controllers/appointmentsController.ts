import { Request, Response } from "express";
import { db } from "../config/db";
import { appointments, users } from "../models/schema";
import { eq, and } from "drizzle-orm";
import { transporter } from "../utils/mailer";

interface AuthenticatedRequest extends Request {
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
    const [appointment] = await db.insert(appointments).values({
      user_id,
      doctor_id,
      appointment_date,
      time_slot,
      total_amount,
      appointment_status: "Pending"
    }).returning();

    // Send confirmation email to user
    const user = await db.query.users.findFirst({ 
      where: eq(users.user_id, user_id) 
    });

    if (user?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Appointment Confirmed",
        html: `
          <h2>Appointment Confirmed ✅</h2>
          <p>Your appointment with Doctor #${doctor_id} on <strong>${appointment_date}</strong> at <strong>${time_slot}</strong> has been successfully booked.</p>
          <p>Looking forward to serving you!</p>
        `
      });
    }

    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not book appointment" });
  }
};

// View appointments for logged-in user
export const getUserAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const result = await db.query.appointments.findMany({
      where: eq(appointments.user_id, userId),
      with: { doctor: true }
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve appointments" });
  }
};

// Doctor view of their bookings
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const doctorId = req.user?.user_id;

  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  try {
    const result = await db.query.appointments.findMany({
      where: eq(appointments.doctor_id, doctorId),
      with: { user: true }
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Unable to retrieve appointments" });
  }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const doctorId = req.user?.user_id;

  const validStatus = ["Completed", "No Show", "Cancelled"];

  if (!validStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.appointment_id, +id), eq(appointments.doctor_id, doctorId)));

    if (!appointment) {
      return res.status(403).json({ message: "Unauthorized or appointment not found" });
    }

    await db
      .update(appointments)
      .set({ appointment_status: status })
      .where(eq(appointments.appointment_id, +id));

    // Send email notification to user about status update
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, +id))
      .leftJoin(users, eq(users.user_id, appointments.user_id));

    if (appt?.users?.email) {
      await transporter.sendMail({
        from: `"Teach2Give" <${process.env.EMAIL_USER}>`,
        to: appt.users.email,
        subject: `Appointment Status: ${status}`,
        html: `
          <p>Hi ${appt.users.firstname || "User"},</p>
          <p>Your appointment #${id} has been marked as <strong>${status}</strong> by your doctor.</p>
          <p>Thank you for using Teach2Give.</p>
        `
      });
    }

    res.status(200).json({ message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

export const cancelAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.user_id;
  const { id } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, +id));

    if (!appt || appt.user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized or not found" });
    }

    if (appt.appointment_status === "Cancelled") {
      return res.status(400).json({ message: "Appointment already cancelled" });
    }

    await db
      .update(appointments)
      .set({ appointment_status: "Cancelled" })
      .where(eq(appointments.appointment_id, +id));

    // Get user and doctor details for email notifications
    const [appointmentDetails] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, +id))
      .leftJoin(users, eq(users.user_id, appointments.user_id));

    // Get doctor details if doctor_id exists
    let doctor = null;
    if (appt.doctor_id) {
      [doctor] = await db
        .select()
        .from(users)
        .where(eq(users.user_id, appt.doctor_id));
    }

    // Send confirmation email to user
    if (appointmentDetails?.users?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: appointmentDetails.users.email,
        subject: "Appointment Cancelled - Confirmation",
        html: `
          <h2>Appointment Cancelled ❌</h2>
          <p>Hi ${appointmentDetails.users.firstname || "User"},</p>
          <p>Your appointment #${id} scheduled for <strong>${appt.appointment_date}</strong> at <strong>${appt.time_slot}</strong> has been successfully cancelled.</p>
          <p>If you need to reschedule, please book a new appointment through our system.</p>
          <p>Thank you for using Teach2Give Care.</p>
        `
      });
    }

    // Send notification email to doctor
    if (doctor?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: doctor.email,
        subject: `Appointment Cancelled by Patient`,
        html: `
          <h2>Patient Appointment Cancelled</h2>
          <p>Dear Dr. ${doctor.firstname || "Doctor"},</p>
          <p>Patient #${userId} (${appointmentDetails?.users?.firstname || "Unknown"} ${appointmentDetails?.users?.lastname || ""}) has cancelled appointment #${id}.</p>
          <p><strong>Original Schedule:</strong> ${appt.appointment_date} at ${appt.time_slot}</p>
          <p>This time slot is now available for other bookings.</p>
          <p>Best regards,<br>Teach2Give Care Team</p>
        `
      });
    }

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Unable to cancel appointment" });
  }
};

export const adminUpdateAppointmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatus = ["Completed", "No Show", "Cancelled", "Pending"];

  if (!validStatus.includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  try {
    await db
      .update(appointments)
      .set({ appointment_status: status })
      .where(eq(appointments.appointment_id, +id));

    // Get appointment details with user and doctor info for notifications
    const [appointmentDetails] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, +id))
      .leftJoin(users, eq(users.user_id, appointments.user_id));

    // Get doctor details if doctor_id exists
    let doctor = null;
    if (appointmentDetails?.appointments?.doctor_id) {
      [doctor] = await db
        .select()
        .from(users)
        .where(eq(users.user_id, appointmentDetails.appointments.doctor_id));
    }

    // Send notification email to user
    if (appointmentDetails?.users?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: appointmentDetails.users.email,
        subject: `Appointment Status Updated: ${status}`,
        html: `
          <h2>Appointment Status Update</h2>
          <p>Hi ${appointmentDetails.users.firstname || "User"},</p>
          <p>Your appointment #${id} status has been updated to <strong>${status}</strong> by our admin team.</p>
          <p><strong>Appointment Details:</strong></p>
          <ul>
            <li>Date: ${appointmentDetails.appointments?.appointment_date}</li>
            <li>Time: ${appointmentDetails.appointments?.time_slot}</li>
            <li>Status: ${status}</li>
          </ul>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Teach2Give Care Team</p>
        `
      });
    }

    // Send notification email to doctor
    if (doctor?.email) {
      await transporter.sendMail({
        from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
        to: doctor.email,
        subject: `Admin Updated Appointment Status: ${status}`,
        html: `
          <h2>Appointment Status Updated by Admin</h2>
          <p>Dear Dr. ${doctor.firstname || "Doctor"},</p>
          <p>Appointment #${id} with patient ${appointmentDetails?.users?.firstname || "Unknown"} ${appointmentDetails?.users?.lastname || ""} has been updated to <strong>${status}</strong> by admin.</p>
          <p><strong>Appointment Details:</strong></p>
          <ul>
            <li>Date: ${appointmentDetails?.appointments?.appointment_date}</li>
            <li>Time: ${appointmentDetails?.appointments?.time_slot}</li>
            <li>New Status: ${status}</li>
          </ul>
          <p>Best regards,<br>Teach2Give Care Admin Team</p>
        `
      });
    }

    res.status(200).json({ message: `Admin updated status to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Could not update appointment status" });
  }
};
