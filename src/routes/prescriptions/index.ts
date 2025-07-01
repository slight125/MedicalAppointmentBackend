import express from "express";
import {
  createPrescription,
  getUserPrescriptions
} from "../../controllers/prescriptionController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

router.use(verifyToken);

// Doctor creates prescription
router.post("/", requireRole("doctor"), createPrescription);

// User views their prescriptions
router.get("/user", requireRole("user"), getUserPrescriptions);

export default router;
