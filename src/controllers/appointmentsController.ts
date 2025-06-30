import { Request, Response } from "express";
import { db } from "../config/db";
import { appointments } from "../models/schema";

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
    await db.insert(appointments).values({
      user_id,
      doctor_id,
      appointment_date,
      time_slot,
      total_amount,
      appointment_status: "Pending"
    });

    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not book appointment" });
  }
};
