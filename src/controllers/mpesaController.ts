import axios from 'axios';
import { Request, Response } from 'express';
import { db } from '../config/db';
import { payments } from '../models/schema';
import { eq } from 'drizzle-orm';

const getMpesaToken = async () => {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get(
    process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
};

export const initiateMpesaPayment = async (req: Request, res: Response) => {
  try {
    const { phone, amount } = req.body;
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'MediCare',
      TransactionDesc: 'Medical Appointment Payment',
    };

    const { data } = await axios.post(
      process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.status(200).json({ message: 'STK Push initiated', data });
  } catch (err: any) {
    console.error('M-Pesa error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initiate M-Pesa payment', error: err.response?.data || err.message });
  }
};

export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (callback && callback.ResultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item || [];
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const receipt = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const phone = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      // Extract appointment_id from AccountReference if present
      const accountReference = callback.AccountReference || '';
      const appointmentIdMatch = accountReference.match(/\d+/);
      const appointment_id = appointmentIdMatch ? parseInt(appointmentIdMatch[0]) : null;
      if (receipt) {
        const [payment] = await db.select().from(payments).where(eq(payments.transaction_id, receipt));
        if (payment) {
          await db.update(payments).set({ payment_status: 'completed', appointment_id, amount: String(amount), payment_date: new Date().toISOString().slice(0,10) }).where(eq(payments.transaction_id, receipt));
        } else {
          await db.insert(payments).values({
            amount: String(amount),
            transaction_id: receipt,
            payment_status: 'completed',
            payment_date: new Date().toISOString().slice(0,10),
            appointment_id,
          });
        }
      }
    }
    res.status(200).json({ message: 'Callback received' });
  } catch (err) {
    console.error('M-Pesa Callback Error:', err);
    res.status(500).json({ message: 'Callback error' });
  }
}; 