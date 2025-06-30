import express from "express";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

// All routes here require valid JWT
router.use(verifyToken);

// Doctor-only dashboard
router.get("/dashboard", requireRole("doctor"), (req, res) => {
  res.json({
    message: "Welcome Doctor 👨‍⚕️",
    patientsToday: 12,
    unreadMessages: 3,
  });
});

export default router;
