import { Request, Response } from "express";
import { db } from "../config/db";
import * as schema from "../models/schema";
import { eq } from "drizzle-orm";
import { generatePrescriptionPDF } from "../utils/pdfGenerator";

const { prescriptions, appointments, users } = schema;

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const createPrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.user?.user_id;
  const { appointment_id, medicines, notes } = req.body;

  try {
    // 1. Get appointment
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, appointment_id));

    if (!appt || appt.doctor_id !== doctorId) {
      res.status(403).json({ message: "Unauthorized or appointment not found" });
      return;
    }

    // 2. Enforce only "Completed" appointments
    if (appt.appointment_status !== "Completed") {
      res.status(400).json({ message: "Prescription can only be created for completed appointments" });
      return;
    }

    // 3. Check if prescription already exists for this appointment
    const [existingPrescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.appointment_id, appointment_id));

    if (existingPrescription) {
      res.status(409).json({ message: "Prescription already exists for this appointment" });
      return;
    }

    // 4. Insert prescription
    await db.insert(prescriptions).values({
      appointment_id,
      doctor_id: doctorId,
      patient_id: appt.user_id,
      medicines: medicines ? JSON.stringify(medicines) : null,
      notes,
      issued_at: new Date()
    });

    res.status(201).json({ message: "Prescription issued successfully" });
  } catch (err) {
    console.error("Prescription error:", err);
    res.status(500).json({ message: "Failed to issue prescription" });
  }
};

export const getUserPrescriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      res.status(400).json({ message: "User ID is missing" });
      return;
    }

    const result = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        appointment_date: appointments.appointment_date,
        appointment_time: appointments.time_slot,
        doctor_name: users.firstname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.patient_id, user_id));

    // Parse medicines JSON for each prescription
    const formattedResult = result.map(prescription => ({
      ...prescription,
      medicines: prescription.medicines ? JSON.parse(prescription.medicines) : null
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("❌ Error fetching user prescriptions:", err);
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};

// Get prescriptions issued by a doctor
export const getDoctorPrescriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.user_id;

    if (!doctorId) {
      res.status(401).json({ message: "Doctor authentication required" });
      return;
    }

    const result = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        appointment_date: appointments.appointment_date,
        appointment_time: appointments.time_slot,
        patient_name: users.firstname,
        patient_lastname: users.lastname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.patient_id, users.user_id))
      .where(eq(prescriptions.doctor_id, doctorId));

    // Parse medicines JSON for each prescription
    const formattedResult = result.map(prescription => ({
      ...prescription,
      medicines: prescription.medicines ? JSON.parse(prescription.medicines) : null,
      patient_full_name: `${prescription.patient_name} ${prescription.patient_lastname || ''}`.trim()
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("❌ Error fetching doctor prescriptions:", err);
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};

// Get a specific prescription by ID (for both doctor and patient)
export const getPrescriptionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const [prescription] = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        doctor_id: prescriptions.doctor_id,
        patient_id: prescriptions.patient_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        appointment_date: appointments.appointment_date,
        appointment_time: appointments.time_slot,
        doctor_name: users.firstname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.prescription_id, parseInt(id)));

    if (!prescription) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }

    // Check authorization: patient can view their own, doctor can view their issued prescriptions
    const isAuthorized = 
      (userRole === "user" && prescription.patient_id === userId) ||
      (userRole === "doctor" && prescription.doctor_id === userId) ||
      userRole === "admin";

    if (!isAuthorized) {
      res.status(403).json({ message: "Unauthorized to view this prescription" });
      return;
    }

    // Parse medicines JSON
    const formattedPrescription = {
      ...prescription,
      medicines: prescription.medicines ? JSON.parse(prescription.medicines) : null
    };

    res.status(200).json(formattedPrescription);
  } catch (err) {
    console.error("❌ Error fetching prescription:", err);
    res.status(500).json({ message: "Failed to fetch prescription" });
  }
};

// Download prescription as PDF
export const downloadPrescriptionPDF = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Get prescription with joined data
    const [prescription] = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        doctor_id: prescriptions.doctor_id,
        patient_id: prescriptions.patient_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        appointment_date: appointments.appointment_date,
        appointment_time: appointments.time_slot,
        doctor_firstname: users.firstname,
        doctor_lastname: users.lastname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.prescription_id, parseInt(id)));

    if (!prescription) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }

    // Check authorization: patient can download their own, doctor can download their issued prescriptions
    const isAuthorized = 
      (userRole === "user" && prescription.patient_id === userId) ||
      (userRole === "doctor" && prescription.doctor_id === userId) ||
      userRole === "admin";

    if (!isAuthorized) {
      res.status(403).json({ message: "Unauthorized to download this prescription" });
      return;
    }

    // Get patient information
    const [patient] = await db
      .select({
        firstname: users.firstname,
        lastname: users.lastname
      })
      .from(users)
      .where(eq(users.user_id, prescription.patient_id!));

    if (!patient) {
      res.status(404).json({ message: "Patient information not found" });
      return;
    }

    // Parse medicines from JSON
    let medicines: string[] = [];
    if (prescription.medicines) {
      try {
        const parsedMedicines = JSON.parse(prescription.medicines);
        if (Array.isArray(parsedMedicines)) {
          medicines = parsedMedicines;
        } else if (typeof parsedMedicines === 'object') {
          // Handle case where medicines might be an object with medicine details
          medicines = Object.values(parsedMedicines).map(med => 
            typeof med === 'string' ? med : JSON.stringify(med)
          );
        }
      } catch (parseError) {
        console.error("Error parsing medicines JSON:", parseError);
        medicines = [prescription.medicines]; // Fallback to raw string
      }
    }

    // Generate PDF
    const pdfData = {
      doctorName: `Dr. ${prescription.doctor_firstname} ${prescription.doctor_lastname || ''}`.trim(),
      patientName: `${patient.firstname} ${patient.lastname || ''}`.trim(),
      appointmentId: prescription.appointment_id!,
      medicines,
      notes: prescription.notes || undefined,
      issuedAt: prescription.issued_at?.toISOString()
    };

    const pdfBuffer = await generatePrescriptionPDF(pdfData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription_${prescription.prescription_id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Error generating prescription PDF:", err);
    res.status(500).json({ message: "Failed to generate prescription PDF" });
  }
};
