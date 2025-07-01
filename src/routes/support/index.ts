import express from "express";
import {
  submitComplaint,
  getAllComplaints,
  updateComplaintStatus
} from "../../controllers/complaintsController";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();
router.use(verifyToken);

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// User creates complaint
router.post("/", requireRole("user"), asyncHandler(submitComplaint));

// Admin views and updates complaints
router.get("/", requireRole("admin"), asyncHandler(getAllComplaints));
router.patch("/:id/status", requireRole("admin"), asyncHandler(updateComplaintStatus));

export default router;
