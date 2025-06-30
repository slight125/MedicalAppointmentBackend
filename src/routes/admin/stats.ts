import express from "express";
import { verifyToken, requireRole } from "../../middleware/authMiddleware";

const router = express.Router();

// 🔐 Protect everything in this file with JWT
router.use(verifyToken);

// 📊 Only accessible to 'admin' users
router.get("/dashboard", requireRole("admin"), (req, res) => {
  res.json({
    status: "success",
    message: "Welcome Admin 👋",
    stats: {
      users: 120,
      doctors: 10,
      appointments: 347,
    },
  });
});

export default router;
