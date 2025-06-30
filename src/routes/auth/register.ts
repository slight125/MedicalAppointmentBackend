import express, { Request, Response, NextFunction } from "express";
import { registerUser } from "../../controllers/authController";

const router = express.Router();

router.post("/register", (req: Request, res: Response, next: NextFunction) => {
  registerUser(req, res).catch(next);
});

export default router;
