import express, { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";
import { db } from '../../config/db';
import { users } from '../../models/schema';
import bcrypt from 'bcrypt';
import axios from 'axios';

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

// PATCH /api/user/profile - Update own profile
router.patch("/profile", asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const { firstname, lastname, contact_phone, address, profile_picture_url } = req.body;
  const updateData: any = {};
  if (firstname !== undefined) updateData.firstname = firstname;
  if (lastname !== undefined) updateData.lastname = lastname;
  if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
  if (address !== undefined) updateData.address = address;
  if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;
  updateData.updated_at = new Date();
  await db.update(users).set(updateData).where(users.user_id.eq(user.user_id));
  res.json({ success: true, message: "Profile updated" });
}));

// POST /api/user/change-password - Change own password
router.post("/change-password", asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both current and new password are required." });
  const [dbUser] = await db.select().from(users).where(users.user_id.eq(user.user_id));
  if (!dbUser) return res.status(404).json({ message: "User not found" });
  const match = await bcrypt.compare(currentPassword, dbUser.password);
  if (!match) return res.status(403).json({ message: "Current password is incorrect" });
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashed, updated_at: new Date() }).where(users.user_id.eq(user.user_id));
  res.json({ success: true, message: "Password changed successfully" });
}));

// POST /api/user/profile-picture - Upload profile picture to Cloudinary and update user
router.post("/profile-picture", asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ message: "Image is required" });
  // Upload to Cloudinary
  const cloudName = "dtm601o6j";
  const uploadPreset = "Medical Appointment Profile Picture";
  const uploadRes = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { file: imageBase64, upload_preset: uploadPreset },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const url = uploadRes.data.secure_url;
  await db.update(users).set({ profile_picture_url: url, updated_at: new Date() }).where(users.user_id.eq(user.user_id));
  res.json({ success: true, url });
}));

export default router;
