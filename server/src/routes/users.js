import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { searchUsers } from "../models/User.js";

const router = Router();
router.use(authMiddleware);

router.get("/search", (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ users: [] });
    const users = searchUsers(q.trim()).filter((u) => u.id !== req.userId);
    res.json({ users });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
