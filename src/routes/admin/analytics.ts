import express from "express";
import { getAdminAnalytics } from "../../controllers/adminController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

router.use(verifyToken);
router.get("/", requireRole("admin"), getAdminAnalytics);

export default router;
