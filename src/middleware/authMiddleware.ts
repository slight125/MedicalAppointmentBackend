import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  console.log('🔍 verifyToken called');
  console.log('🔍 authHeader:', authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('❌ No valid auth header found');
    res.status(401).json({ message: "Access token missing or invalid" });
    return;
  }

  const token = authHeader.split(" ")[1];
  console.log('🔍 Token extracted:', token ? 'Token exists' : 'No token');

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in your .env file.");
    res.status(500).json({ message: "Server misconfiguration: JWT secret missing." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthRequest["user"];
    console.log('🔍 Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (roles: string | string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
};

export const allowRoles = (...roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
};
