import nodemailer from "nodemailer";
import { appointmentConfirmation, appointmentStatusUpdate, paymentConfirmation, prescriptionNotification } from "./emailTemplates";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendAppointmentConfirmation = async (data: any) => {
  return transporter.sendMail({
    from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
    to: data.userEmail,
    subject: "Appointment Confirmed",
    html: appointmentConfirmation(data),
  });
};

export const sendStatusUpdate = async (data: any) => {
  return transporter.sendMail({
    from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
    to: data.userEmail,
    subject: `Appointment Status: ${data.status}`,
    html: appointmentStatusUpdate(data),
  });
};

export const sendPaymentConfirmation = async (data: any) => {
  return transporter.sendMail({
    from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
    to: data.userEmail,
    subject: "Payment Confirmation",
    html: paymentConfirmation(data),
  });
};

export const sendPrescriptionNotification = async (data: any) => {
  return transporter.sendMail({
    from: `"Teach2Give Care" <${process.env.EMAIL_USER}>`,
    to: data.userEmail,
    subject: "New Prescription Available",
    html: prescriptionNotification(data),
  });
};
