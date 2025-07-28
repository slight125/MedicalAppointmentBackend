import express from "express";
import {
  submitComplaint,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getUserComplaints,
  updateComplaint,
  getDoctorComplaints,
  addComplaintMessage,
  getComplaintMessages
} from "../../controllers/complaintsController";
import { verifyToken, requireRole, allowRoles } from "../../middleware/authMiddleware";

const router = express.Router();
router.use(verifyToken);

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// User creates complaint
router.post("/", requireRole("user"), asyncHandler(submitComplaint));

// User views their own complaints
router.get("/", requireRole("user"), asyncHandler(getUserComplaints));
// Admin views all complaints
router.get("/all", requireRole("admin"), asyncHandler(getAllComplaints));
router.patch("/:id/status", requireRole("admin"), asyncHandler(updateComplaintStatus));

// User edits their own complaint
router.patch("/:id", requireRole("user"), asyncHandler(updateComplaint));

// Doctor views complaints for their patients
router.get("/doctor", requireRole("doctor"), asyncHandler(getDoctorComplaints));

// Delete complaint (admin or user)
router.delete("/:id", allowRoles("admin", "user"), asyncHandler(deleteComplaint));

router.get('/:id/messages', asyncHandler(getComplaintMessages));
router.post('/:id/messages', verifyToken, asyncHandler(addComplaintMessage));

export default router;
