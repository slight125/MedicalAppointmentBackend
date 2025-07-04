import express from "express";
import { db } from "../../config/db";
import { payments, appointments, prescriptions, users, complaints } from "../../models/schema";
import { eq, sql, gte } from "drizzle-orm";

const router = express.Router();

// Simple payment test without authentication
router.post("/simple-payment", express.json(), async (req, res): Promise<void> => {
  const { appointment_id = 1, amount = 50.00 } = req.body;

  try {
    console.log("🧪 Testing simple payment for appointment:", appointment_id);
    
    // Insert payment record
    const testPayment = await db.insert(payments).values({
      appointment_id: parseInt(appointment_id),
      amount: amount.toString(),
      transaction_id: `simple_test_${Date.now()}`,
      payment_status: "paid",
      payment_date: new Date().toISOString().split('T')[0]
    }).returning();

    console.log("✅ Simple payment created:", testPayment[0]);

    res.status(200).json({
      success: true,
      message: "Simple payment test successful",
      payment: testPayment[0]
    });
  } catch (error) {
    console.error("❌ Simple payment test failed:", error);
    res.status(500).json({ error: "Failed to process simple payment test" });
  }
});

// Test appointment update (will work after migration)
router.post("/test-appointment-update", express.json(), async (req, res): Promise<void> => {
  const { appointment_id = 1 } = req.body;

  try {
    console.log("🧪 Testing appointment update for:", appointment_id);
    
    // Try to mark appointment as paid
    const result = await db.update(appointments)
      .set({ paid: true })
      .where(eq(appointments.appointment_id, parseInt(appointment_id)))
      .returning();

    console.log("✅ Appointment updated:", result[0]);

    res.status(200).json({
      success: true,
      message: "Appointment marked as paid",
      appointment: result[0]
    });
  } catch (error: any) {
    console.error("❌ Appointment update failed:", error);
    res.status(500).json({ 
      error: "Failed to update appointment", 
      details: error.message 
    });
  }
});

// List payments without relations (to avoid schema issues)
router.get("/simple-payments", async (req, res): Promise<void> => {
  try {
    const allPayments = await db.select().from(payments);
    res.status(200).json(allPayments);
  } catch (error) {
    console.error("❌ Failed to fetch payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Test prescription creation without full authentication
router.post("/test-prescription", express.json(), async (req, res): Promise<void> => {
  const { 
    appointment_id = 1, 
    doctor_id = 1, 
    medicines = [{ name: "Aspirin", dosage: "100mg", frequency: "Once daily" }],
    notes = "Test prescription"
  } = req.body;

  try {
    console.log("🧪 Testing prescription creation for appointment:", appointment_id);
    
    // Get appointment details
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointment_id, parseInt(appointment_id)));

    if (!appt) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    // Check if appointment status is "Completed"
    if (appt.appointment_status !== "Completed") {
      res.status(400).json({ 
        error: "Prescription can only be created for completed appointments",
        current_status: appt.appointment_status 
      });
      return;
    }

    // Check if prescription already exists
    const [existingPrescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.appointment_id, parseInt(appointment_id)));

    if (existingPrescription) {
      res.status(409).json({ error: "Prescription already exists for this appointment" });
      return;
    }

    // Create prescription
    const testPrescription = await db.insert(prescriptions).values({
      appointment_id: parseInt(appointment_id),
      doctor_id: parseInt(doctor_id),
      patient_id: appt.user_id,
      medicines: JSON.stringify(medicines),
      notes,
      issued_at: new Date()
    }).returning();

    console.log("✅ Test prescription created:", testPrescription[0]);

    res.status(201).json({
      success: true,
      message: "Test prescription created successfully",
      prescription: {
        ...testPrescription[0],
        medicines: JSON.parse(testPrescription[0].medicines || '[]')
      }
    });
  } catch (error: any) {
    console.error("❌ Prescription test failed:", error);
    res.status(500).json({ 
      error: "Failed to create test prescription", 
      details: error.message 
    });
  }
});

// Test medical history retrieval
router.get("/test-medical-history/:userId", async (req, res): Promise<void> => {
  const { userId = "1" } = req.params;

  try {
    console.log("🧪 Testing medical history for user:", userId);
    
    // Get user's appointments
    const userAppointments = await db
      .select({
        appointment_id: appointments.appointment_id,
        appointment_date: appointments.appointment_date,
        time_slot: appointments.time_slot,
        appointment_status: appointments.appointment_status,
        paid: appointments.paid,
        total_amount: appointments.total_amount,
        doctor_name: users.firstname
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.doctor_id, users.user_id))
      .where(eq(appointments.user_id, parseInt(userId)));

    // Get user's prescriptions
    const userPrescriptions = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        doctor_name: users.firstname
      })
      .from(prescriptions)
      .leftJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.patient_id, parseInt(userId)));

    console.log("✅ Medical history retrieved successfully!");

    res.status(200).json({
      success: true,
      message: "Medical history retrieved successfully",
      data: {
        appointments: userAppointments,
        prescriptions: userPrescriptions.map(p => ({
          ...p,
          medicines: p.medicines ? JSON.parse(p.medicines) : null
        }))
      }
    });
  } catch (error: any) {
    console.error("❌ Medical history test failed:", error);
    res.status(500).json({ 
      error: "Failed to retrieve medical history", 
      details: error.message 
    });
  }
});

// Test CSV export functionality (without authentication)
router.get("/test-csv-export", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing CSV export functionality...");
    
    // Get appointments data with basic joins
    const appointmentsData = await db
      .select({
        appointment_id: appointments.appointment_id,
        appointment_date: appointments.appointment_date,
        time_slot: appointments.time_slot,
        appointment_status: appointments.appointment_status,
        paid: appointments.paid,
        total_amount: appointments.total_amount,
        patient_name: users.firstname,
        patient_lastname: users.lastname,
        created_at: appointments.created_at
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.user_id, users.user_id));

    // Format data for CSV
    const formatted = appointmentsData.map((appt) => ({
      AppointmentID: appt.appointment_id,
      Patient: `${appt.patient_name || 'N/A'} ${appt.patient_lastname || ''}`.trim(),
      Date: appt.appointment_date,
      Time: appt.time_slot,
      Status: appt.appointment_status,
      Paid: appt.paid ? "Yes" : "No",
      Amount: appt.total_amount,
      CreatedAt: appt.created_at
    }));

    console.log("✅ CSV test data formatted successfully!");

    res.status(200).json({
      success: true,
      message: "CSV export test successful",
      data: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("❌ CSV export test failed:", error);
    res.status(500).json({ 
      error: "Failed to test CSV export", 
      details: error.message 
    });
  }
});

// Test payments CSV export
router.get("/test-payments-csv", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing payments CSV export...");
    
    const paymentsData = await db
      .select({
        payment_id: payments.payment_id,
        appointment_id: payments.appointment_id,
        amount: payments.amount,
        payment_status: payments.payment_status,
        transaction_id: payments.transaction_id,
        payment_date: payments.payment_date,
        created_at: payments.created_at
      })
      .from(payments);

    const formatted = paymentsData.map((pmt) => ({
      PaymentID: pmt.payment_id,
      AppointmentID: pmt.appointment_id,
      Amount: pmt.amount,
      Status: pmt.payment_status,
      TransactionID: pmt.transaction_id,
      PaymentDate: pmt.payment_date,
      Created: pmt.created_at ? new Date(pmt.created_at).toLocaleString() : "N/A"
    }));

    console.log("✅ Payments CSV test data formatted successfully!");

    res.status(200).json({
      success: true,
      message: "Payments CSV export test successful",
      data: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("❌ Payments CSV export test failed:", error);
    res.status(500).json({ 
      error: "Failed to test payments CSV export", 
      details: error.message 
    });
  }
});

// Test prescriptions CSV export
router.get("/test-prescriptions-csv", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing prescriptions CSV export...");
    
    const prescriptionsData = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        patient_name: users.firstname,
        patient_lastname: users.lastname,
        created_at: prescriptions.created_at
      })
      .from(prescriptions)
      .leftJoin(users, eq(prescriptions.patient_id, users.user_id));

    const formatted = prescriptionsData.map((rx) => ({
      PrescriptionID: rx.prescription_id,
      Patient: `${rx.patient_name || 'N/A'} ${rx.patient_lastname || ''}`.trim(),
      IssuedAt: rx.issued_at ? new Date(rx.issued_at).toLocaleString() : "N/A",
      Medicines: rx.medicines ? JSON.parse(rx.medicines).map((m: any) => `${m.name} ${m.dosage}`).join(", ") : "N/A",
      Notes: rx.notes || "N/A",
      AppointmentID: rx.appointment_id,
      Created: rx.created_at ? new Date(rx.created_at).toLocaleString() : "N/A"
    }));

    console.log("✅ Prescriptions CSV test data formatted successfully!");

    res.status(200).json({
      success: true,
      message: "Prescriptions CSV export test successful",
      data: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("❌ Prescriptions CSV export test failed:", error);
    res.status(500).json({ 
      error: "Failed to test prescriptions CSV export", 
      details: error.message 
    });
  }
});

// Test users CSV export
router.get("/test-users-csv", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing users CSV export...");
    
    const usersData = await db
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
      .from(users);

    const formatted = usersData.map((u) => ({
      UserID: u.user_id,
      Name: `${u.firstname || ''} ${u.lastname || ''}`.trim() || "N/A",
      Email: u.email,
      Role: u.role,
      Phone: u.contact_phone || "N/A",
      Address: u.address || "N/A",
      Created: u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"
    }));

    console.log("✅ Users CSV test data formatted successfully!");

    res.status(200).json({
      success: true,
      message: "Users CSV export test successful",
      data: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("❌ Users CSV export test failed:", error);
    res.status(500).json({ 
      error: "Failed to test users CSV export", 
      details: error.message 
    });
  }
});

// Test complaints CSV export
router.get("/test-complaints-csv", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing complaints CSV export...");
    
    const complaintsData = await db
      .select({
        complaint_id: complaints.complaint_id,
        subject: complaints.subject,
        description: complaints.description,
        status: complaints.status,
        related_appointment_id: complaints.related_appointment_id,
        user_name: users.firstname,
        user_lastname: users.lastname,
        user_email: users.email,
        created_at: complaints.created_at,
        updated_at: complaints.updated_at
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.user_id, users.user_id));

    const formatted = complaintsData.map((c) => ({
      TicketID: c.complaint_id,
      Subject: c.subject || "N/A",
      Description: c.description || "N/A",
      Status: c.status,
      User: `${c.user_name || ''} ${c.user_lastname || ''}`.trim() || "N/A",
      UserEmail: c.user_email || "N/A",
      AppointmentID: c.related_appointment_id || "N/A",
      Created: c.created_at ? new Date(c.created_at).toLocaleString() : "N/A",
      Updated: c.updated_at ? new Date(c.updated_at).toLocaleString() : "N/A"
    }));

    console.log("✅ Complaints CSV test data formatted successfully!");

    res.status(200).json({
      success: true,
      message: "Complaints CSV export test successful",
      data: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("❌ Complaints CSV export test failed:", error);
    res.status(500).json({ 
      error: "Failed to test complaints CSV export", 
      details: error.message 
    });
  }
});

// Test admin analytics summary
router.get("/test-analytics-summary", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing admin analytics summary...");
    
    // Get basic counts
    const totalUsers = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const totalDoctors = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.role, "doctor"));
    const totalAppointments = await db.select({ count: sql<number>`COUNT(*)` }).from(appointments);
    const totalPayments = await db.select({ count: sql<number>`COUNT(*)` }).from(payments);

    // Calculate revenue
    const paymentsSum = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`
    }).from(payments);

    const summary = {
      totals: {
        users: totalUsers[0]?.count || 0,
        doctors: totalDoctors[0]?.count || 0,
        appointments: totalAppointments[0]?.count || 0,
        payments: totalPayments[0]?.count || 0,
        revenue: paymentsSum[0]?.revenue || 0
      }
    };

    console.log("✅ Analytics summary test successful!");

    res.status(200).json({
      success: true,
      message: "Analytics summary test successful",
      data: summary
    });
  } catch (error: any) {
    console.error("❌ Analytics summary test failed:", error);
    res.status(500).json({ 
      error: "Failed to test analytics summary", 
      details: error.message 
    });
  }
});

// Test booking trends
router.get("/test-booking-trends", async (req, res): Promise<void> => {
  try {
    console.log("🧪 Testing booking trends...");
    
    const days = 7;
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

    console.log("✅ Booking trends test successful!");

    res.status(200).json({
      success: true,
      message: "Booking trends test successful",
      data: results,
      range: `${days} days`
    });
  } catch (error: any) {
    console.error("❌ Booking trends test failed:", error);
    res.status(500).json({ 
      error: "Failed to test booking trends", 
      details: error.message 
    });
  }
});

// Test prescription PDF generation
router.get("/test-prescription-pdf/:prescriptionId", async (req, res): Promise<void> => {
  const { prescriptionId = "1" } = req.params;

  try {
    console.log("🧪 Testing prescription PDF generation for ID:", prescriptionId);
    
    // Get prescription with all necessary data
    const [prescription] = await db
      .select({
        prescription_id: prescriptions.prescription_id,
        appointment_id: prescriptions.appointment_id,
        medicines: prescriptions.medicines,
        notes: prescriptions.notes,
        issued_at: prescriptions.issued_at,
        doctor_firstname: users.firstname,
        doctor_lastname: users.lastname,
        patient_id: prescriptions.patient_id
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(prescriptions.appointment_id, appointments.appointment_id))
      .innerJoin(users, eq(prescriptions.doctor_id, users.user_id))
      .where(eq(prescriptions.prescription_id, parseInt(prescriptionId)));

    if (!prescription) {
      res.status(404).json({ error: "Prescription not found" });
      return;
    }

    if (!prescription.patient_id) {
      res.status(400).json({ error: "Prescription has no associated patient" });
      return;
    }

    // Get patient information
    const [patient] = await db
      .select({
        firstname: users.firstname,
        lastname: users.lastname
      })
      .from(users)
      .where(eq(users.user_id, prescription.patient_id));

    if (!patient) {
      res.status(404).json({ error: "Patient information not found" });
      return;
    }

    // Import PDF generator (dynamic import to avoid issues)
    const { generatePrescriptionPDF } = await import("../../utils/pdfGenerator");

    // Parse medicines from JSON
    let medicines: string[] = [];
    if (prescription.medicines) {
      try {
        const parsedMedicines = JSON.parse(prescription.medicines);
        if (Array.isArray(parsedMedicines)) {
          medicines = parsedMedicines.map(med => 
            typeof med === 'string' ? med : 
            (med.name ? `${med.name} - ${med.dosage || ''} ${med.frequency || ''}`.trim() : JSON.stringify(med))
          );
        }
      } catch (parseError) {
        medicines = [prescription.medicines];
      }
    }

    // Generate PDF data
    const pdfData = {
      doctorName: `Dr. ${prescription.doctor_firstname} ${prescription.doctor_lastname || ''}`.trim(),
      patientName: `${patient.firstname} ${patient.lastname || ''}`.trim(),
      appointmentId: prescription.appointment_id || 0,
      medicines,
      notes: prescription.notes || undefined,
      issuedAt: prescription.issued_at?.toISOString()
    };

    const pdfBuffer = await generatePrescriptionPDF(pdfData);

    console.log("✅ Prescription PDF generated successfully!");

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="test_prescription_${prescriptionId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("❌ Prescription PDF test failed:", error);
    res.status(500).json({ 
      error: "Failed to generate test prescription PDF", 
      details: error.message 
    });
  }
});

export default router;
