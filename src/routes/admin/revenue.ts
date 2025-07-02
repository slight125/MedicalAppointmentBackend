import express from "express";
import { getDailyRevenue } from "../../controllers/adminController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();
router.use(verifyToken);
router.get("/daily", requireRole("admin"), getDailyRevenue);

export default router;
