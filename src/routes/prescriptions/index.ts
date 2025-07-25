import express from "express";
import {
  createPrescription,
  getUserPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionById,
  downloadPrescriptionPDF,
  updatePrescription,
  deletePrescription,
  getAllPrescriptions
} from "../../controllers/prescriptionController";
import { verifyToken, requireRole, allowRoles } from "../../middleware/authMiddleware";

const router = express.Router();

// Doctor creates prescription (POST /api/prescriptions)
router.post("/", verifyToken, allowRoles("doctor"), createPrescription);

// User views their prescriptions (GET /api/prescriptions/user)
router.get("/user", verifyToken, requireRole("user"), getUserPrescriptions);

// Doctor views their issued prescriptions (GET /api/prescriptions/doctor)
router.get("/doctor", verifyToken, requireRole("doctor"), getDoctorPrescriptions);

// Admin views all prescriptions (GET /api/prescriptions)
router.get("/", verifyToken, requireRole("admin"), getAllPrescriptions);

// Download prescription as PDF (GET /api/prescriptions/:id/pdf)
router.get("/:id/pdf", verifyToken, downloadPrescriptionPDF);

// Get specific prescription by ID (GET /api/prescriptions/:id)
router.get("/:id", verifyToken, getPrescriptionById);

// Update prescription (doctor or admin)
router.patch("/:id", verifyToken, allowRoles("doctor", "admin"), updatePrescription);
// Delete prescription (doctor or admin)
router.delete("/:id", verifyToken, allowRoles("doctor", "admin"), deletePrescription);

export default router;
