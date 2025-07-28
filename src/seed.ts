import { db } from "./config/db";
import { users, doctors, appointments, prescriptions, payments, complaints } from "./models/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const seed = async () => {
  console.log("🚀 Seeding database...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await db.delete(payments);
  await db.delete(complaints);
  await db.delete(prescriptions);
  await db.delete(appointments);
  await db.delete(doctors);
  await db.delete(users);
  console.log("✅ Existing data cleared");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // --- USERS ---
  const userSeed = [
    { firstname: "Alice", lastname: "Otieno", email: "alice@example.com", password: hashedPassword, contact_phone: "0700123456", address: "Nairobi, KE", role: "user" },
    { firstname: "John", lastname: "Doe", email: "john@example.com", password: hashedPassword, contact_phone: "0700123457", address: "Mombasa, KE", role: "user" },
    { firstname: "Mary", lastname: "Smith", email: "mary@example.com", password: hashedPassword, contact_phone: "0700123458", address: "Kisumu, KE", role: "user" },
    { firstname: "Peter", lastname: "Kimani", email: "peter@example.com", password: hashedPassword, contact_phone: "0700123459", address: "Nakuru, KE", role: "user" },
    { firstname: "Linda", lastname: "Mwangi", email: "linda@example.com", password: hashedPassword, contact_phone: "0700123460", address: "Eldoret, KE", role: "user" },
    { firstname: "James", lastname: "Omondi", email: "james@example.com", password: hashedPassword, contact_phone: "0700123461", address: "Kakamega, KE", role: "user" },
    { firstname: "Janet", lastname: "Wanjiru", email: "janet@example.com", password: hashedPassword, contact_phone: "0700123462", address: "Machakos, KE", role: "user" },
    { firstname: "Brian", lastname: "Otieno", email: "brian@example.com", password: hashedPassword, contact_phone: "0700123463", address: "Kisii, KE", role: "user" },
    { firstname: "Faith", lastname: "Koech", email: "faith@example.com", password: hashedPassword, contact_phone: "0700123464", address: "Kericho, KE", role: "user" },
    { firstname: "Samuel", lastname: "Mutua", email: "samuel@example.com", password: hashedPassword, contact_phone: "0700123465", address: "Kitale, KE", role: "user" },
    { firstname: "Admin", lastname: "Mugo", email: "admin@hospital.com", password: hashedPassword, contact_phone: "0711002200", address: "Thika", role: "admin" },
    // Doctors as users
    { firstname: "Brian", lastname: "Mutua", email: "brian@clinic.com", password: hashedPassword, contact_phone: "0700987654", address: "Nairobi, KE", role: "doctor" },
    { firstname: "Grace", lastname: "Njeri", email: "grace@clinic.com", password: hashedPassword, contact_phone: "0700111222", address: "Mombasa, KE", role: "doctor" },
    { firstname: "James", lastname: "Kiprotich", email: "james@clinic.com", password: hashedPassword, contact_phone: "0700333444", address: "Kisumu, KE", role: "doctor" },
    { firstname: "Susan", lastname: "Mwende", email: "susan@clinic.com", password: hashedPassword, contact_phone: "0700445566", address: "Nakuru, KE", role: "doctor" },
    { firstname: "David", lastname: "Kamau", email: "david@clinic.com", password: hashedPassword, contact_phone: "0700556677", address: "Eldoret, KE", role: "doctor" },
    { firstname: "Esther", lastname: "Chebet", email: "esther@clinic.com", password: hashedPassword, contact_phone: "0700667788", address: "Kericho, KE", role: "doctor" },
  ];

  const doctorSeed = [
    { first_name: "Brian", last_name: "Mutua", specialization: "General Practitioner", contact_phone: "0700987654", available_days: "Monday, Wednesday, Friday", user_email: "brian@clinic.com" },
    { first_name: "Grace", last_name: "Njeri", specialization: "Pediatrics", contact_phone: "0700111222", available_days: "Tuesday, Thursday", user_email: "grace@clinic.com" },
    { first_name: "James", last_name: "Kiprotich", specialization: "Cardiology", contact_phone: "0700333444", available_days: "Monday, Tuesday, Wednesday, Friday", user_email: "james@clinic.com" },
    { first_name: "Susan", last_name: "Mwende", specialization: "Dermatology", contact_phone: "0700445566", available_days: "Monday, Thursday", user_email: "susan@clinic.com" },
    { first_name: "David", last_name: "Kamau", specialization: "Orthopedics", contact_phone: "0700556677", available_days: "Wednesday, Friday", user_email: "david@clinic.com" },
    { first_name: "Esther", last_name: "Chebet", specialization: "Neurology", contact_phone: "0700667788", available_days: "Tuesday, Friday", user_email: "esther@clinic.com" },
  ];

  const insertedUsers = await db.insert(users).values(userSeed).returning();
  console.log(`Inserted users: ${insertedUsers.length}`);

  for (const doc of doctorSeed as any[]) {
    const user = insertedUsers.find((u: any) => u.email === doc.user_email);
    (doc as any).user_id = user ? user.user_id : null;
    if ('user_email' in doc) delete (doc as any).user_email;
  }

  const insertedDoctors = await db.insert(doctors).values(doctorSeed as any[]).returning();
  console.log(`Inserted doctors: ${insertedDoctors.length}`);

  // --- APPOINTMENTS ---
  const diagnoses = ["Hypertension", "Asthma", "Flu"];
  const treatments = ["Lifestyle modification", "Inhaler use", "Antivirals"];
  const medications = ["Lisinopril", "Albuterol", "Tamiflu"];
  const notesArr = ["Responding well", "Needs follow-up", "Continue medication"];

  const appointmentStatuses = ["Completed", "Confirmed", "Pending", "Cancelled"];
  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];
  const appointmentSeed = [];
  const userPatients = insertedUsers.filter(u => u.role === "user");

  for (const doctor of insertedDoctors) {
    for (let j = 0; j < 10; j++) {
      const user = userPatients[(doctor.doctor_id + j) % userPatients.length];
      const status = appointmentStatuses[j % appointmentStatuses.length];
      const day = ((doctor.doctor_id + j) % 28) + 1;
      const timeSlot = timeSlots[j % timeSlots.length];
      // Set a random fee for each doctor if not already set
      if (!doctor.fee) doctor.fee = (2000 + Math.floor(Math.random() * 3000)).toString();
      appointmentSeed.push({
        user_id: user.user_id,
        doctor_id: doctor.doctor_id,
        appointment_date: `2025-03-${String(day).padStart(2, "0")}`,
        time_slot: timeSlot,
        total_amount: doctor.fee,
        appointment_status: status,
        paid: status === "Completed" || status === "Confirmed",
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
        medications: medications[Math.floor(Math.random() * medications.length)],
        notes: notesArr[Math.floor(Math.random() * notesArr.length)],
      });
    }
  }

  const uniqueAppointments = [];
  const seen = new Set();
  for (const appt of appointmentSeed) {
    const key = `${appt.user_id}-${appt.doctor_id}-${appt.appointment_date}-${appt.time_slot}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAppointments.push(appt);
    }
  }

  let insertedAppointments = await db.insert(appointments).values(uniqueAppointments).returning();
  console.log(`Inserted appointments: ${insertedAppointments.length}`);

  for (const user of userPatients) {
    let userAppointments = insertedAppointments.filter(a => a.user_id === user.user_id);
    let completed = userAppointments.filter(a => a.appointment_status === "Completed");
    if (completed.length < 2) {
      for (let i = 0; i < userAppointments.length && completed.length < 2; i++) {
        if (userAppointments[i].appointment_status !== "Completed") {
          userAppointments[i].appointment_status = "Completed";
          completed.push(userAppointments[i]);
        }
      }
    }
    for (const appt of userAppointments) {
      await db.update(appointments).set({ appointment_status: appt.appointment_status }).where(eq(appointments.appointment_id, appt.appointment_id));
    }
  }

  insertedAppointments = await db.select().from(appointments) as any[];

  // --- PRESCRIPTIONS ---
  const prescriptionSeed = [];

  // Ensure Alice gets some prescriptions
  const alice = insertedUsers.find(u => u.email === 'alice@example.com');
  if (alice) {
    const aliceAppointments = insertedAppointments.filter(a => a.user_id === alice.user_id);
    const completedAppointments = aliceAppointments.filter(a => a.appointment_status === "Completed");
    
    // If Alice doesn't have completed appointments, mark some as completed
    if (completedAppointments.length === 0 && aliceAppointments.length > 0) {
      for (let i = 0; i < Math.min(3, aliceAppointments.length); i++) {
        await db.update(appointments)
          .set({ appointment_status: "Completed" })
          .where(eq(appointments.appointment_id, aliceAppointments[i].appointment_id));
      }
      // Refresh the appointments list
      insertedAppointments = await db.select().from(appointments) as any[];
    }
    
    // Create prescriptions for Alice
    const aliceCompletedAppointments = insertedAppointments.filter(a => 
      a.user_id === alice.user_id && a.appointment_status === "Completed"
    );
    
    for (let i = 0; i < Math.min(5, aliceCompletedAppointments.length); i++) {
      const appt = aliceCompletedAppointments[i];
      prescriptionSeed.push({
        appointment_id: appt.appointment_id,
        doctor_id: appt.doctor_id,
        patient_id: alice.user_id,
        medicines: JSON.stringify([
          { name: medications[Math.floor(Math.random() * medications.length)], dosage: "500mg", instructions: "After meals" },
          { name: medications[Math.floor(Math.random() * medications.length)], dosage: "250mg", instructions: "Before bed" },
        ]),
        notes: notesArr[Math.floor(Math.random() * notesArr.length)],
        issued_at: new Date(`2024-12-${String(((alice.user_id) % 28) + 1).padStart(2, '0')}`),
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
      });
    }
  }

  for (const doctor of insertedDoctors) {
    const doctorAppointments = insertedAppointments.filter(a => a.doctor_id === doctor.doctor_id && a.appointment_status === "Completed");
    if (!doctorAppointments || doctorAppointments.length === 0) continue;
    for (let i = 0; i < Math.max(8, doctorAppointments.length); i++) {
      const appt = doctorAppointments[i % doctorAppointments.length];
      if (!appt) continue;
      prescriptionSeed.push({
        appointment_id: appt.appointment_id,
        doctor_id: appt.doctor_id,
        patient_id: appt.user_id,
        medicines: JSON.stringify([
          { name: medications[Math.floor(Math.random() * medications.length)], dosage: "500mg", instructions: "After meals" },
          { name: medications[Math.floor(Math.random() * medications.length)], dosage: "250mg", instructions: "Before bed" },
        ]),
        notes: notesArr[Math.floor(Math.random() * notesArr.length)],
        issued_at: new Date(`2024-12-${String(((appt?.user_id ?? 1) % 28) + 1).padStart(2, '0')}`),
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
      });
    }
  } // ✅ ← This closing brace was missing before!

  for (const user of userPatients) {
    const userCompleted = insertedAppointments.filter(a => a.user_id === user.user_id && a.appointment_status === "Completed");
    for (let i = 0; i < Math.max(2, userCompleted.length); i++) {
      const appt = userCompleted[i % userCompleted.length];
      if (!appt) continue;
      prescriptionSeed.push({
        appointment_id: appt.appointment_id,
        doctor_id: appt.doctor_id,
        patient_id: appt.user_id,
        medicines: JSON.stringify([
          { name: medications[Math.floor(Math.random() * medications.length)], dosage: "500mg", instructions: "After meals" },
        ]),
        notes: notesArr[Math.floor(Math.random() * notesArr.length)],
        issued_at: new Date(`2024-12-${String(((appt.user_id ?? 1) % 28) + 1).padStart(2, '0')}`),
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
      });
    }
  }

  await db.insert(prescriptions).values(prescriptionSeed);
  const prescriptionCount = await db.select().from(prescriptions);
  console.log(`Inserted prescriptions: ${prescriptionCount.length}`);

  // --- PAYMENTS ---
  const paymentSeed = insertedAppointments.map((appt, i) => ({
    appointment_id: appt.appointment_id,
    amount: appt.total_amount,
    payment_status: i % 3 === 0 ? "completed" : i % 3 === 1 ? "pending" : "failed",
    transaction_id: i % 2 === 0 ? `tx_${100000 + i}` : `MPESA${100000 + i}`,
    payment_date: `2024-12-${String((i % 28) + 1).padStart(2, "0")}`,
  }));
  await db.insert(payments).values(paymentSeed);
  const paymentCount = await db.select().from(payments);
  console.log(`Inserted payments: ${paymentCount.length}`);

  // --- COMPLAINTS ---
  const complaintCategories = ["technical", "billing", "appointment", "general"];
  const complaintPriorities = ["low", "medium", "high", "urgent"];
  const complaintSeed = [];
  for (const user of userPatients) {
    const userAppointments = insertedAppointments.filter(a => a.user_id === user.user_id);
    for (let c = 0; c < 5; c++) {
      const appt = userAppointments[Math.floor(Math.random() * userAppointments.length)];
      if (!appt) continue;
      complaintSeed.push({
        user_id: user.user_id,
        related_appointment_id: appt.appointment_id,
        subject: `Support ticket #${c + 1} for appointment #${appt.appointment_id}`,
        description: notesArr[Math.floor(Math.random() * notesArr.length)],
        status: c % 3 === 0 ? "Open" : c % 3 === 1 ? "Resolved" : "In Progress",
        category: complaintCategories[(user.user_id + c) % complaintCategories.length],
        priority: complaintPriorities[(user.user_id + c) % complaintPriorities.length],
      });
    }
  }
  await db.insert(complaints).values(complaintSeed);
  const complaintCount = await db.select().from(complaints);
  console.log(`Inserted complaints: ${complaintCount.length}`);

  // --- FINAL SUMMARY ---
  console.log("✅ Seed complete!");
  console.log("📊 Seeded data:");
  console.log(`- Users: ${insertedUsers.length}`);
  console.log(`- Doctors: ${insertedDoctors.length}`);
  console.log(`- Appointments: ${insertedAppointments.length}`);
  console.log(`- Prescriptions: ${prescriptionCount.length}`);
  console.log(`- Payments: ${paymentCount.length}`);
  console.log(`- Complaints: ${complaintCount.length}`);
  console.log("\n🔐 Login credentials:");
  console.log("Patient: alice@example.com / password123");
  console.log("Doctor: brian@clinic.com / password123");
  console.log("Admin: admin@hospital.com / password123");

  process.exit();
};

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
