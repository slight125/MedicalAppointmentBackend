import express from "express";
import { Parser } from "json2csv";
import { appointments, users, doctors, payments, prescriptions, complaints } from "../../models/schema";
import { db } from "../../config/db";
import { verifyToken, allowRoles } from "../../middleware/authMiddleware";

const router = express.Router();

router.get("/appointments.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    const data = await db.query.appointments.findMany({
      with: {
        user: true,
        doctor: true
      }
    });

    const formatted = data.map((appt) => ({
      AppointmentID: appt.appointment_id,
      Patient: appt.user ? `${appt.user.firstname} ${appt.user.lastname}` : "N/A",
      Doctor: appt.doctor ? `${appt.doctor.first_name} ${appt.doctor.last_name}` : "N/A",
      Date: appt.appointment_date,
      Time: appt.time_slot,
      Status: appt.appointment_status,
      Paid: appt.paid ? "Yes" : "No",
      Amount: appt.total_amount,
      CreatedAt: appt.created_at
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("appointments_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to generate appointments CSV" });
  }
});

router.get("/payments.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    const data = await db.query.payments.findMany({
      with: { appointment: true }
    });

    const formatted = data.map((pmt) => ({
      PaymentID: pmt.payment_id,
      AppointmentID: pmt.appointment_id,
      Amount: pmt.amount,
      Status: pmt.payment_status,
      TransactionID: pmt.transaction_id,
      PaymentDate: pmt.payment_date,
      Created: pmt.created_at ? new Date(pmt.created_at).toLocaleString() : "N/A"
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("payments_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("Payments CSV export error:", err);
    res.status(500).json({ message: "Failed to generate payments CSV" });
  }
});

router.get("/prescriptions.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    const data = await db.query.prescriptions.findMany({
      with: { patient: true, doctor: true }
    });

    const formatted = data.map((rx) => ({
      PrescriptionID: rx.prescription_id,
      Patient: rx.patient ? `${rx.patient.firstname} ${rx.patient.lastname}` : "N/A",
      Doctor: rx.doctor ? `${rx.doctor.first_name} ${rx.doctor.last_name}` : "N/A",
      IssuedAt: rx.issued_at ? new Date(rx.issued_at).toLocaleString() : "N/A",
      Medicines: rx.medicines ? JSON.parse(rx.medicines).map((m: any) => `${m.name} ${m.dosage}`).join(", ") : "N/A",
      Notes: rx.notes || "N/A",
      AppointmentID: rx.appointment_id
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("prescriptions_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("Prescriptions CSV export error:", err);
    res.status(500).json({ message: "Failed to generate prescriptions CSV" });
  }
});

router.get("/users.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    const usersData = await db.query.users.findMany();

    const formatted = usersData.map((u) => ({
      UserID: u.user_id,
      Name: `${u.firstname || ''} ${u.lastname || ''}`.trim() || "N/A",
      Email: u.email,
      Role: u.role,
      Phone: u.contact_phone || "N/A",
      Address: u.address || "N/A",
      Created: u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("users_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("Users CSV export error:", err);
    res.status(500).json({ message: "Failed to generate users CSV" });
  }
});

router.get("/complaints.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    const complaintsData = await db.query.complaints.findMany({
      with: { user: true }
    });

    const formatted = complaintsData.map((c) => ({
      TicketID: c.complaint_id,
      Subject: c.subject || "N/A",
      Description: c.description || "N/A",
      Status: c.status,
      User: c.user ? `${c.user.firstname} ${c.user.lastname}`.trim() : "N/A",
      UserEmail: c.user?.email || "N/A",
      AppointmentID: c.related_appointment_id || "N/A",
      Created: c.created_at ? new Date(c.created_at).toLocaleString() : "N/A",
      Updated: c.updated_at ? new Date(c.updated_at).toLocaleString() : "N/A"
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("complaints_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("Complaints CSV export error:", err);
    res.status(500).json({ message: "Failed to generate complaints CSV" });
  }
});

export default router;
