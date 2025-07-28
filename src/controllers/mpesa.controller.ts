import { Request, Response } from "express";
import { initiateSTKPush } from "../services/mpesa.service";

export const payForBooking = async (req: Request, res: Response) => {
  const { phone, amount, appointment_id } = req.body;

  // ✅ Input validation
  if (!phone || !amount || !appointment_id) {
    res.status(400).json({
      message: "Phone number, amount, and appointment_id are required.",
    });
    return;
  }

  // ✅ Format phone number to 254...
  const formattedPhone = phone.startsWith("254")
    ? phone
    : phone.replace(/^0/, "254");

  try {
    const result = await initiateSTKPush(formattedPhone, amount, appointment_id);

    res.status(200).json({
      message: "STK push initiated successfully.",
      data: result,
    });
    return;
  } catch (err: any) {
    console.error("STK Push Error:", err.response?.data || err.message);

    res.status(500).json({
      message: "Payment failed to initiate.",
      error: err.response?.data || err.message,
    });
    return;
  }
}; 