import { db } from "./config/db";
import { users, doctors, appointments, prescriptions, payments, complaints } from "./models/schema";
import bcrypt from "bcrypt";

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

  // 1. Add 10 users (patients), 6 doctors (varied specializations), 1 admin
  // 2. Add 12 appointments (varied users, doctors, statuses, dates)
  // 3. Add 12 prescriptions (linked to appointments)
  // 4. Add 12 payments (linked to appointments, varied statuses)
  // 5. Add 12 complaints (varied users, appointments, statuses)
  // Use realistic names, specializations, and data for demo/testing

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
  ];

  // --- DOCTORS ---
  const doctorSeed = [
    { first_name: "Brian", last_name: "Mutua", specialization: "General Practitioner", contact_phone: "0700987654", available_days: "Monday, Wednesday, Friday" },
    { first_name: "Grace", last_name: "Njeri", specialization: "Pediatrics", contact_phone: "0700111222", available_days: "Tuesday, Thursday" },
    { first_name: "James", last_name: "Kiprotich", specialization: "Cardiology", contact_phone: "0700333444", available_days: "Monday, Tuesday, Wednesday, Friday" },
    { first_name: "Susan", last_name: "Mwende", specialization: "Dermatology", contact_phone: "0700445566", available_days: "Monday, Thursday" },
    { first_name: "David", last_name: "Kamau", specialization: "Orthopedics", contact_phone: "0700556677", available_days: "Wednesday, Friday" },
    { first_name: "Esther", last_name: "Chebet", specialization: "Neurology", contact_phone: "0700667788", available_days: "Tuesday, Friday" },
  ];

  // Insert users
  const insertedUsers = await db.insert(users).values(userSeed).returning();

  // Insert doctors
  const insertedDoctors = await db.insert(doctors).values(doctorSeed).returning();

  // Sample dynamic data for medical history
  const diagnoses = [
    'Hypertension', 'Diabetes Mellitus', 'Asthma', 'Migraine', 'Seasonal Allergies',
    'Acute Bronchitis', 'Gastritis', 'Anxiety Disorder', 'Back Pain', 'Flu',
  ];
  const treatments = [
    'Lifestyle modification and medication', 'Insulin therapy', 'Inhaler use',
    'Pain management', 'Antihistamines', 'Antibiotics', 'Proton pump inhibitors',
    'Cognitive behavioral therapy', 'Physical therapy', 'Rest and fluids',
  ];
  const medications = [
    'Lisinopril', 'Metformin', 'Albuterol', 'Sumatriptan', 'Cetirizine',
    'Amoxicillin', 'Omeprazole', 'Sertraline', 'Ibuprofen', 'Oseltamivir',
  ];
  const notesArr = [
    'Patient is responding well to treatment.',
    'Follow-up in two weeks recommended.',
    'Monitor blood pressure daily.',
    'Advised to avoid allergens.',
    'Continue current medication regimen.',
    'Patient education provided.',
    'Encouraged to maintain healthy diet.',
    'Discussed stress management techniques.',
    'Physical activity recommended.',
    'No adverse reactions reported.',
  ];

  // --- APPOINTMENTS ---
  // For each user, create 5 appointments with all statuses and all doctors
  const appointmentStatuses = ['Completed', 'Confirmed', 'Pending', 'Cancelled'];
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
  const appointmentSeed = [];
  const completedAppointments = [];
  for (const user of insertedUsers.filter(u => u.role === 'user')) {
    for (let j = 0; j < 5; j++) {
      const doctor = insertedDoctors[j % insertedDoctors.length];
      const status = appointmentStatuses[j % appointmentStatuses.length];
      const day = ((user.user_id + j) % 28) + 1;
      const timeSlot = timeSlots[j % timeSlots.length];
      const appt = {
        user_id: user.user_id,
        doctor_id: doctor.doctor_id,
        appointment_date: `2025-03-${String(day).padStart(2, '0')}`,
        time_slot: timeSlot,
        total_amount: (2500 + Math.floor(Math.random() * 2000)).toString(),
        appointment_status: status,
        paid: status === 'Completed' || status === 'Confirmed',
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
        medications: medications[Math.floor(Math.random() * medications.length)],
        notes: notesArr[Math.floor(Math.random() * notesArr.length)],
      };
      appointmentSeed.push(appt);
      if (status === 'Completed') completedAppointments.push(appt);
    }
  }
  // Deduplicate appointmentSeed
  const uniqueAppointments = [];
  const seen = new Set();
  for (const appt of appointmentSeed) {
    const key = `${appt.user_id}-${appt.doctor_id}-${appt.appointment_date}-${appt.time_slot}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAppointments.push(appt);
    }
  }
  const insertedAppointments = await db.insert(appointments).values(uniqueAppointments).returning();

  // --- PRESCRIPTIONS ---
  // Every completed appointment gets a prescription
  const prescriptionSeed = [];
  for (const appt of insertedAppointments.filter(a => a.appointment_status === 'Completed')) {
    prescriptionSeed.push({
      appointment_id: appt.appointment_id,
      doctor_id: appt.doctor_id,
      patient_id: appt.user_id,
      medicines: JSON.stringify([
        { name: medications[Math.floor(Math.random() * medications.length)], dosage: '500mg', instructions: 'Take after meals' },
        { name: medications[Math.floor(Math.random() * medications.length)], dosage: '250mg', instructions: 'Take before bed' },
      ]),
      notes: notesArr[Math.floor(Math.random() * notesArr.length)],
      issued_at: new Date(`2024-12-${String(((appt.user_id) % 28) + 1).padStart(2, '0')}`),
      diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
      treatment: treatments[Math.floor(Math.random() * treatments.length)],
    });
  }
  await db.insert(prescriptions).values(prescriptionSeed);

  // --- PAYMENTS ---
  // Every appointment gets a payment (Stripe or M-Pesa)
  const paymentSeed = insertedAppointments.map((appt, i) => ({
    appointment_id: appt.appointment_id,
    amount: appt.total_amount,
    payment_status: i % 3 === 0 ? 'completed' : (i % 3 === 1 ? 'pending' : 'failed'),
    transaction_id: i % 2 === 0 ? `tx_${100000 + i}` : `MPESA${100000 + i}`,
    payment_date: `2024-12-${String(((i % 28) + 1)).padStart(2, '0')}`,
  }));
  await db.insert(payments).values(paymentSeed);

  // --- COMPLAINTS ---
  // Every user has 3 support tickets linked to real appointments
  const complaintCategories = ['technical', 'billing', 'appointment', 'general'];
  const complaintPriorities = ['low', 'medium', 'high', 'urgent'];
  const complaintSeed = [];
  for (const user of insertedUsers.filter(u => u.role === 'user')) {
    const userAppointments = insertedAppointments.filter(a => a.user_id === user.user_id);
    for (let c = 0; c < 3; c++) {
      const appt = userAppointments[c % userAppointments.length];
      complaintSeed.push({
        user_id: user.user_id,
        related_appointment_id: appt.appointment_id,
        subject: `Support ticket #${c+1} for appointment #${appt.appointment_id}`,
        description: notesArr[Math.floor(Math.random() * notesArr.length)],
        status: c % 3 === 0 ? 'Open' : (c % 3 === 1 ? 'Resolved' : 'In Progress'),
        category: complaintCategories[(user.user_id + c) % complaintCategories.length],
        priority: complaintPriorities[(user.user_id + c) % complaintPriorities.length],
      });
    }
  }
  await db.insert(complaints).values(complaintSeed);

  console.log("✅ Seed complete!");
  console.log("📊 Seeded data:");
  console.log("- Users: 7 (3 patients, 3 doctors, 1 admin)");
  console.log("- Doctors: 3");
  console.log("- Appointments: 3");
  console.log("- Prescriptions: 3");
  console.log("- Payments: 3");
  console.log("- Complaints: 3");
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
