import { Router } from "express";
import { payForBooking } from "../controllers/mpesa.controller";

const MpesaRoute = Router();

MpesaRoute.post("/stkpush", payForBooking);

// Add callback endpoint
MpesaRoute.post("/callback", (req, res) => {
  console.log('M-Pesa Callback:', req.body);
  res.status(200).json({ message: 'Callback received' });
});

export default MpesaRoute; 