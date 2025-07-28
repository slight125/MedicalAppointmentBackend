import express, { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(verifyToken as express.RequestHandler);

// User-only access
router.get("/dashboard", requireRole("user"), asyncHandler((req: Request, res: Response) => {
  res.json({
    message: "Welcome User 👋",
    upcomingAppointments: 2,
    prescriptionRefills: 1,
  });
}));

// Get user profile
router.get("/profile", asyncHandler((req: Request, res: Response) => {
  // Return the user data from the JWT token
  const user = (req as any).user;
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    user: {
      user_id: user.user_id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      contact_phone: user.contact_phone,
      address: user.address,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
}));

export default router;
