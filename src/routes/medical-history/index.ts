import express from "express";
import {
  getSelfMedicalHistory,
  getUserMedicalHistory
} from "../../controllers/medicalHistoryController";
import { verifyToken, allowRoles } from "../../middleware/authMiddleware";

const router = express.Router();

// User or doctor views their own medical history (GET /api/medical-history/self)
router.get("/self", verifyToken, allowRoles("user", "doctor"), getSelfMedicalHistory);

// Admin/Doctor views any user's medical history (GET /api/medical-history/:userId)
router.get("/:userId", verifyToken, allowRoles("doctor", "admin"), getUserMedicalHistory);

export default router;
