import express, { Request, Response, NextFunction } from "express";
import { loginUser } from "../../controllers/authController";

const router = express.Router();

// Helper to wrap async route handlers and pass errors to next()
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
  };

router.post("/login", asyncHandler(loginUser));

export default router;
