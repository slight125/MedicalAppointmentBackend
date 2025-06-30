import express, { RequestHandler } from "express";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

router.use(verifyToken as RequestHandler);

// User-only access
router.get("/dashboard", requireRole("user"), (req: Request, res: Response) => {
  res.json({
    message: "Welcome User 👋",
    upcomingAppointments: 2,
    prescriptionRefills: 1,
  });
});

export default router;
