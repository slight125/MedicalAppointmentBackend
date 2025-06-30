import express from "express";
import { bookAppointment } from "../../controllers/appointmentsController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

router.use(verifyToken);
router.post("/", requireRole("user"), bookAppointment);

export default router;
