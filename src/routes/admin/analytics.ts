import express from "express";
import { getAdminAnalytics, getDailyRevenue } from "../../controllers/adminController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

router.use(verifyToken);
router.get("/", requireRole("admin"), getAdminAnalytics);
router.get("/daily-revenue", requireRole("admin"), getDailyRevenue);

export default router;
