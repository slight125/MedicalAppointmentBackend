import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import registerRoute from "./routes/auth/register";
import loginRoute from "./routes/auth/login";
import adminStatsRoute from "./routes/admin/stats";
import adminAnalyticsRoute from "./routes/admin/analytics";
import userDashboard from "./routes/user/dashboard";
import doctorDashboard from "./routes/doctor/dashboard";
import appointmentRoute from "./routes/appointments/book";
import appointmentsRoute from "./routes/appointments/index";
import prescriptionsRoute from "./routes/prescriptions/index";
import supportRoutes from "./routes/support/index";
import paymentsRoute from "./routes/payments"; 
import adminRevenueRoute from "./routes/admin/revenue";
import testEmailRoute from "./routes/testEmail";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/admin", adminStatsRoute);
app.use("/api/admin/analytics", adminAnalyticsRoute);
app.use("/api/user", userDashboard);
app.use("/api/doctor", doctorDashboard);
app.use("/api/appointments", appointmentRoute);
app.use("/api/appointments", appointmentsRoute);
app.use("/api/prescriptions", prescriptionsRoute);
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentsRoute);
app.use("/api/admin/revenue", adminRevenueRoute);
app.use("/api/test", testEmailRoute);

app.get("/", (_, res) => {
  res.send("🏥 Medical Appointment API is alive!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server ready at http://localhost:${PORT}`);
});





