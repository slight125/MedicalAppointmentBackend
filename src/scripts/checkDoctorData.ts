import { db } from '../config/db';
import { users, doctors, appointments, complaints } from '../models/schema';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function checkDoctorData() {
  // 1. Doctors without a user
  const allDoctors = await db.select().from(doctors);
  const allUsers = await db.select().from(users);
  const userIds = new Set(allUsers.map(u => u.user_id));
  const doctorsWithoutUser = allDoctors.filter(d => d.user_id != null && !userIds.has(d.user_id));

  // 2. Users with doctor role but no doctor profile
  const doctorRoleUsers = allUsers.filter(u => u.role === 'doctor');
  const doctorUserIds = new Set(allDoctors.map(d => d.user_id).filter((id): id is number => id !== null));
  const usersWithoutDoctorProfile = doctorRoleUsers.filter(u => !doctorUserIds.has(u.user_id));

  // 3. Appointments with invalid doctor_id
  const allAppointments = await db.select().from(appointments);
  const doctorIds = new Set(allDoctors.map(d => d.doctor_id));
  const appointmentsWithInvalidDoctor = allAppointments.filter(
    a => a.doctor_id == null || !doctorIds.has(a.doctor_id as number)
  );

  // 4. Complaints with null or invalid related_appointment_id
  const allComplaints = await db.select().from(complaints);
  const appointmentIds = new Set(allAppointments.map(a => a.appointment_id));
  const complaintsWithNullAppointment = allComplaints.filter(c => c.related_appointment_id == null);
  const complaintsWithInvalidAppointment = allComplaints.filter(c => c.related_appointment_id != null && !appointmentIds.has(c.related_appointment_id));

  console.log('--- Doctor Data Check ---');
  console.log('Doctors without a user:', doctorsWithoutUser);
  console.log('Users with doctor role but no doctor profile:', usersWithoutDoctorProfile);
  console.log('Appointments with invalid doctor_id:', appointmentsWithInvalidDoctor);
  console.log('Complaints with null related_appointment_id:', complaintsWithNullAppointment);
  console.log('Complaints with invalid related_appointment_id:', complaintsWithInvalidAppointment);
  console.log('--- End of Check ---');
  process.exit(0);
}

checkDoctorData().catch(err => {
  console.error('Error running doctor data check:', err);
  process.exit(1);
}); 