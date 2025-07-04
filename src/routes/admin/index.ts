import express from "express";
import { verifyToken, allowRoles } from "../../middleware/authMiddleware";
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  searchUsers
} from "../../controllers/adminController";

const router = express.Router();

// GET /api/admin/users - Get all users (admin only)
router.get("/users", verifyToken, allowRoles("admin"), getAllUsers);

// GET /api/admin/users/search - Search users by name or email (admin only)
router.get("/users/search", verifyToken, allowRoles("admin"), searchUsers);

// GET /api/admin/users/:id - Get user by ID (admin only)
router.get("/users/:id", verifyToken, allowRoles("admin"), getUserById);

// PATCH /api/admin/users/:id - Update user (admin only)
router.patch("/users/:id", verifyToken, allowRoles("admin"), updateUser);

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete("/users/:id", verifyToken, allowRoles("admin"), deleteUser);

export default router;
