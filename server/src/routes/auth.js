import { Router } from "express";
import { createUser, findUserByUsername, findUserById, verifyPassword, updateLastLogin } from "../models/User.js";
import { authMiddleware, generateToken } from "../middleware/auth.js";

const router = Router();

const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "请求过于频繁，请15分钟后再试" });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now > record.resetTime) rateLimitStore.delete(ip);
  }
}, RATE_LIMIT_WINDOW);

router.post("/register", rateLimiter, (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const user = createUser(username, password, displayName);
    const token = generateToken(user.id, username);
    res.status(201).json({ token, user: { id: user.id, username, displayName: user.displayName } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", rateLimiter, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const user = findUserByUsername(username);
    if (!user || !verifyPassword(user, password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    updateLastLogin(user.id);
    const token = generateToken(user.id, username);
    res.json({
      token,
      user: { id: user.id, username, displayName: user.display_name, avatar_color: user.avatar_color },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

export default router;
