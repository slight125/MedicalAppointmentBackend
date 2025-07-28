import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  user_id: serial("user_id").primaryKey(),
  firstname: varchar("firstname", { length: 100 }),
  lastname: varchar("lastname", { length: 100 }),
  email: varchar("email", { length: 100 }).unique(),
  password: varchar("password", { length: 255 }),
  contact_phone: varchar("contact_phone", { length: 20 }),
  address: text("address"),
  role: varchar("role", { length: 20 }).default("user"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Doctors Table
export const doctors = pgTable("doctors", {
  doctor_id: serial("doctor_id").primaryKey(),
  user_id: integer("user_id").references(() => users.user_id), // Added for user mapping
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  specialization: varchar("specialization", { length: 100 }),
  contact_phone: varchar("contact_phone", { length: 20 }),
  available_days: text("available_days"),
  fee: decimal("fee", { precision: 10, scale: 2 }), // Appointment fee in Ksh
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Appointments Table
export const appointments = pgTable("appointments", {
  appointment_id: serial("appointment_id").primaryKey(),
  user_id: integer("user_id").references(() => users.user_id),
  doctor_id: integer("doctor_id").references(() => doctors.doctor_id),
  appointment_date: date("appointment_date"),
  time_slot: varchar("time_slot", { length: 50 }),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }),
  appointment_status: varchar("appointment_status", { length: 20 }), // Pending, Confirmed, Cancelled
  paid: boolean("paid").default(false),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  medications: text("medications"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Prescriptions Table
export const prescriptions = pgTable("prescriptions", {
  prescription_id: serial("prescription_id").primaryKey(),
  appointment_id: integer("appointment_id").references(() => appointments.appointment_id),
  doctor_id: integer("doctor_id").references(() => doctors.doctor_id),
  patient_id: integer("patient_id").references(() => users.user_id),
  medicines: text("medicines"), // JSON string of medicines array
  notes: text("notes"),
  issued_at: timestamp("issued_at"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Payments Table
export const payments = pgTable("payments", {
  payment_id: serial("payment_id").primaryKey(),
  appointment_id: integer("appointment_id").references(() => appointments.appointment_id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  payment_status: varchar("payment_status", { length: 20 }),
  transaction_id: varchar("transaction_id", { length: 100 }),
  payment_date: date("payment_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Complaints Table
export const complaints = pgTable("complaints", {
  complaint_id: serial("complaint_id").primaryKey(),
  user_id: integer("user_id").references(() => users.user_id),
  related_appointment_id: integer("related_appointment_id").references(() => appointments.appointment_id),
  subject: varchar("subject", { length: 150 }),
  description: text("description"),
  category: varchar("category", { length: 50 }), // NEW
  priority: varchar("priority", { length: 20 }), // NEW
  status: varchar("status", { length: 20 }), // Open, In Progress, Resolved, Closed
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const complaint_messages = pgTable("complaint_messages", {
  message_id: serial("message_id").primaryKey(),
  complaint_id: integer("complaint_id").references(() => complaints.complaint_id),
  sender_id: integer("sender_id").references(() => users.user_id),
  sender_role: varchar("sender_role", { length: 20 }),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});


// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  complaints: many(complaints),
}));

// Doctors Relations
export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
  prescriptions: many(prescriptions),
}));

// Appointments Relations
export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  user: one(users, { fields: [appointments.user_id], references: [users.user_id] }),
  doctor: one(doctors, { fields: [appointments.doctor_id], references: [doctors.doctor_id] }),
  prescription: many(prescriptions),
  payment: many(payments),
  complaints: many(complaints),
}));

// Prescriptions Relations
export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  appointment: one(appointments, { fields: [prescriptions.appointment_id], references: [appointments.appointment_id] }),
  doctor: one(doctors, { fields: [prescriptions.doctor_id], references: [doctors.doctor_id] }),
  patient: one(users, { fields: [prescriptions.patient_id], references: [users.user_id] }),
}));

// Payments Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  appointment: one(appointments, { fields: [payments.appointment_id], references: [appointments.appointment_id] }),
}));

// Complaints Relations
export const complaintsRelations = relations(complaints, ({ one }) => ({
  user: one(users, { fields: [complaints.user_id], references: [users.user_id] }),
  appointment: one(appointments, { fields: [complaints.related_appointment_id], references: [appointments.appointment_id] }),
}));
export const schema = {
  users,
  doctors,
  appointments,
  prescriptions,
  payments,
  complaints,
};