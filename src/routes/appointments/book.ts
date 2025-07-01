import express from "express";
import { bookAppointment } from "../../controllers/appointmentsController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

router.use(verifyToken);
router.post("/", requireRole("user"), (req, res, next) => {
  Promise.resolve(bookAppointment(req, res)).catch(next);
});

export default router;
