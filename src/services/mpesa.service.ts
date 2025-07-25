import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const {
  DARAJA_CONSUMER_KEY,
  DARAJA_CONSUMER_SECRET,
  DARAJA_SHORT_CODE,
  DARAJA_PASSKEY,
  DARAJA_CALLBACK_URL,
} = process.env;

// Validate environment variables
if (
  !DARAJA_CONSUMER_KEY ||
  !DARAJA_CONSUMER_SECRET ||
  !DARAJA_SHORT_CODE ||
  !DARAJA_PASSKEY ||
  !DARAJA_CALLBACK_URL
) {
  throw new Error("🚨 Missing required Daraja environment variables");
}

// 1. Get access token
export const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString("base64");

  try {
    const res = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    console.log("✅ Daraja Access Token:", res.data.access_token);
    return res.data.access_token;
  } catch (err: any) {
    console.error("❌ Failed to get access token:", err.response?.data || err.message);
    throw new Error("Daraja access token fetch failed");
  }
};

// 2. Initiate STK Push
export const initiateSTKPush = async (phone: string, amount: number) => {
  const accessToken = await getAccessToken();

  // Generate timestamp: YYYYMMDDHHMMSS
  const date = new Date();
  const timestamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0");

  const password = Buffer.from(
    `${DARAJA_SHORT_CODE}${DARAJA_PASSKEY}${timestamp}`
  ).toString("base64");

  const formattedPhone = phone.startsWith("254")
    ? phone
    : phone.replace(/^0/, "254");

  const payload = {
    BusinessShortCode: DARAJA_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: DARAJA_SHORT_CODE,
    PhoneNumber: formattedPhone,
    CallBackURL: DARAJA_CALLBACK_URL,
    AccountReference: "Medicare HealthSystem",
    TransactionDesc: "Booking Payment",
  };

  try {
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("✅ STK Push Request Sent:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ STK Push Failed:", err.response?.data || err.message);
    throw new Error("Daraja STK push failed");
  }
}; 