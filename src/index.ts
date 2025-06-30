import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import registerRoute from "./routes/auth/register";
import loginRoute from "./routes/auth/login";
import adminStatsRoute from "./routes/admin/stats";
import userDashboard from "./routes/user/dashboard";
import doctorDashboard from "./routes/doctor/dashboard";
import appointmentRoute from "./routes/appointments/book";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/admin", adminStatsRoute);
app.use("/api/user", userDashboard);
app.use("/api/doctor", doctorDashboard);
app.use("/api/appointments", appointmentRoute);

app.get("/", (_, res) => {
  res.send("🏥 Medical Appointment API is alive!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server ready at http://localhost:${PORT}`);
});
