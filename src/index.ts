// Configure dotenv first before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import registerRoute from "./routes/auth/register";
import loginRoute from "./routes/auth/login";
import adminStatsRoute from "./routes/admin/stats";
import adminAnalyticsRoute from "./routes/admin/analytics";
import adminReportsRoute from "./routes/admin/reports";
import adminRoute from "./routes/admin/index";
import userDashboard from "./routes/user/dashboard";
import doctorDashboard from "./routes/doctor/dashboard";
import appointmentsRoute from "./routes/appointments/index";
import prescriptionsRoute from "./routes/prescriptions/index";
import medicalHistoryRoute from "./routes/medical-history/index";
import supportRoutes from "./routes/support/index";
import paymentsRoute from "./routes/payments/index"; 
import adminRevenueRoute from "./routes/admin/revenue";
import paymentWebhook from "./routes/payments/webhook";
import testPaymentsRoute from "./routes/dev/test-payments";
import mpesaRoutes from './routes/payments/mpesa';
import MpesaRoute from './routes/mpesa.route';
import { db } from "./config/db";

dotenv.config();

const app = express();

app.locals.db = db;

app.use(cors());

// Apply webhook routes BEFORE express.json() middleware
app.use("/api/webhooks", paymentWebhook);

// Apply JSON parsing to all other routes
app.use(express.json());

// Test public route
app.get("/api/test-public", (req, res) => {
  res.json({ message: "Public endpoint working", timestamp: new Date() });
});

app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/admin", adminStatsRoute);
app.use("/api/admin", adminRoute);
app.use("/api/admin/analytics", adminAnalyticsRoute);
app.use("/api/admin/reports", adminReportsRoute);
app.use("/api/user", userDashboard);
app.use("/api/doctor", doctorDashboard);
app.use("/api/appointments", appointmentsRoute);
app.use("/api/prescriptions", prescriptionsRoute);
app.use("/api/medical-history", medicalHistoryRoute);
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentsRoute);
app.use("/api/payments/mpesa", mpesaRoutes);
app.use('/api/mpesa', MpesaRoute);
app.use("/api/admin/revenue", adminRevenueRoute);
app.use("/api/dev", testPaymentsRoute);

app.get("/", (_, res) => {
  res.send("🏥 Medical Appointment API is alive!");
});

const PORT = process.env.PORT || 3000;

// Add error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🔥🚀🚀 Server ready at http://localhost:${PORT}`);
});

// Keep the process alive
setInterval(() => {
  // This keeps the process running
}, 1000 * 60 * 5); // 5 minutes





