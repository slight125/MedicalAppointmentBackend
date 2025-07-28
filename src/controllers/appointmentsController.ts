import { Request, Response } from "express";
import { db } from "../config/db";
import { appointments, users, doctors } from "../models/schema";
import { eq, and } from "drizzle-orm";
import { transporter, sendAppointmentConfirmation } from "../utils/mailer";
import { sendStatusUpdate } from "../utils/mailer";

export interface AuthenticatedRequest extends Request {
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
    time_slot
  } = req.body;

  if (!user_id || !doctor_id || !appointment_date || !time_slot) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Fetch doctor's fee from doctor profile
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.doctor_id, doctor_id)
    });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const total_amount = doctor.fee || 2000; // Default fee if not set
    const [appointment] = await db.insert(appointments).values({
      user_id,
      doctor_id,
      appointment_date: String(appointment_date),
      time_slot,
      total_amount: String(total_amount),
      appointment_status: "Pending"
    }).returning();

    // Get user and doctor details for email
    const user = await db.query.users.findFirst({ 
      where: eq(users.user_id, user_id) 
    });
    const doctorProfile = await db.query.doctors.findFirst({
      where: eq(doctors.doctor_id, doctor_id)
    });

    if (user?.email) {
      await sendAppointmentConfirmation({
        userEmail: user.email,
        userName: `${user.firstname} ${user.lastname}`,
        doctorName: `${doctorProfile?.first_name} ${doctorProfile?.last_name}`,
        date: appointment_date,
        timeSlot: time_slot,
        amount: total_amount,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/appointments/${appointment.appointment_id}`,
      });
    }

    res.status(201).json({ 
      message: "Appointment booked successfully",
      appointment_id: appointment.appointment_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not book appointment" });
  }
};

// View appointments for logged-in user
export const getUserAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.user_id;
  
  console.log('🔍 getUserAppointments called');
  console.log('🔍 req.user:', req.user);
  console.log('🔍 userId:', userId);

  if (!userId) {
    console.log('❌ No user ID found in request');
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    console.log('🔍 Querying appointments for user_id:', userId);
    const result = await db.query.appointments.findMany({
      where: eq(appointments.user_id, userId),
      with: { doctor: true }
    });

    console.log('🔍 Found appointments:', result.length);
    console.log('🔍 Appointments:', result);

    res.status(200).json(result);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({ message: "Unable to retrieve appointments" });
  }
};

// Doctor view of their bookings
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  try {
    // Find the doctor row for this user
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.user_id, userId) });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found for this user." });
    }
    const result = await db.query.appointments.findMany({
      where: eq(appointments.doctor_id, doctor.doctor_id),
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
      res.status(403).json({ message: "Unauthorized or appointment not found" });
      return;
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
      await sendStatusUpdate({
        userEmail: appt.users.email,
        userName: `${appt.users.firstname} ${appt.users.lastname}`,
        appointmentId: id,
        status: status,
        feedbackUrl: `${process.env.FRONTEND_URL}/feedback/${id}`,
        prescriptionUrl: `${process.env.FRONTEND_URL}/prescriptions/${id}`,
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

export const adminUpdateAppointmentAmount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { total_amount } = req.body;

  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only admins can update appointment amount.' });
    return;
  }
  if (!total_amount) {
    res.status(400).json({ message: 'total_amount is required.' });
    return;
  }
  try {
    await db.update(appointments)
      .set({ total_amount })
      .where(eq(appointments.appointment_id, +id));
    res.status(200).json({ message: 'Appointment amount updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update appointment amount.' });
  }
};

export const deleteAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.user_id;
  const userRole = req.user?.role;
  try {
    // Only allow admin, the user who booked, or the doctor to delete
    const [appt] = await db.select().from(appointments).where(eq(appointments.appointment_id, parseInt(id)));
    if (!appt) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    if (userRole !== "admin" && appt.user_id !== userId && appt.doctor_id !== userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    await db.delete(appointments).where(eq(appointments.appointment_id, parseInt(id)));
    res.status(200).json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete appointment" });
  }
};

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctorList = await db.query.doctors.findMany({
      orderBy: (doctors, { asc }) => [asc(doctors.first_name)],
    });

    res.status(200).json({
      message: "Doctors retrieved successfully",
      doctors: doctorList
    });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Could not fetch doctors" });
  }
};

// Get appointment stats for analytics (appointments per month)
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    // Example: Count appointments per month for the current year
    const stats = await db.execute(`
      SELECT 
        TO_CHAR(appointment_date, 'Mon') AS month,
        COUNT(*) AS count
      FROM appointments
      WHERE EXTRACT(YEAR FROM appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY month, EXTRACT(MONTH FROM appointment_date)
      ORDER BY EXTRACT(MONTH FROM appointment_date)
    `);

    res.status(200).json(stats.rows); // Adjust if your db client returns differently
  } catch (err) {
    res.status(500).json({ message: "Could not fetch appointment stats" });
  }
};

export const getAllAppointmentsAdmin = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can view all appointments.' });
  }
  try {
    const result = await db.query.appointments.findMany({
      with: { doctor: true, user: true }
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Unable to retrieve all appointments' });
  }
};

// Add this endpoint for updating doctor fee
export const updateDoctorFee = async (req: AuthenticatedRequest, res: Response) => {
  const { doctor_id } = req.params;
  const { fee } = req.body;
  const userId = req.user?.user_id;
  const userRole = req.user?.role;

  console.log('🔍 updateDoctorFee debug:', {
    doctor_id,
    fee,
    userId,
    userRole,
    user: req.user
  });

  if (!fee || isNaN(Number(fee))) {
    return res.status(400).json({ message: 'Fee is required and must be a number.' });
  }

  try {
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.doctor_id, Number(doctor_id)) });

    console.log('🔍 Doctor found:', doctor);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    console.log('🔍 Authorization check:', {
      userRole,
      doctorUserId: doctor.user_id,
      requestUserId: userId,
      isAdmin: userRole === 'admin',
      isOwnDoctor: userRole === 'doctor' && doctor.user_id === userId
    });

    // Allow admin to update any doctor's fee, or doctor to update their own fee
    if (userRole === 'admin' || (userRole === 'doctor' && doctor.user_id === userId)) {
      await db.update(doctors)
        .set({ fee: fee.toString() })
        .where(eq(doctors.doctor_id, Number(doctor_id)));
      return res.status(200).json({ message: 'Doctor fee updated successfully.' });
    } else {
      return res.status(403).json({ message: 'Unauthorized to update this doctor\'s fee.' });
    }
  } catch (error) {
    console.error('❌ Error updating doctor fee:', error);
    return res.status(500).json({ message: 'Failed to update doctor fee.' });
  }
};
