import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { requireAdmin, userToJSON } from "../middleware.js";

const router = Router();

router.get("/", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY user_id").all();
  res.json(rows.map(userToJSON));
});

router.post("/", requireAdmin, (req, res) => {
  const { username, password, fullName, role } = req.body || {};
  if (!username || !password || !fullName || !role) return res.status(400).json({ message: "Missing fields" });
  if (!["admin", "staff"].includes(role)) return res.status(400).json({ message: "Invalid role" });
  const existing = db.prepare("SELECT user_id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(409).json({ message: "Username already exists" });
  const result = db.prepare(
    "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)"
  ).run(username, bcrypt.hashSync(password, 10), fullName, role);
  const u = db.prepare("SELECT * FROM users WHERE user_id = ?").get(result.lastInsertRowid);
  res.status(201).json(userToJSON(u));
});

router.patch("/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM users WHERE user_id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Not found" });

  const { username, password, fullName, role } = req.body || {};
  const updates = [];
  const params = [];

  if (username !== undefined) {
    if (!username) return res.status(400).json({ message: "Username is required" });
    const clash = db.prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ?").get(username, id);
    if (clash) return res.status(409).json({ message: "Username already exists" });
    updates.push("username = ?");
    params.push(username);
  }

  if (fullName !== undefined) {
    if (!fullName) return res.status(400).json({ message: "Full name is required" });
    updates.push("full_name = ?");
    params.push(fullName);
  }

  if (role !== undefined) {
    if (!["admin", "staff"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    updates.push("role = ?");
    params.push(role);
  }

  if (password !== undefined && password !== "") {
    updates.push("password_hash = ?");
    params.push(bcrypt.hashSync(password, 10));
  }

  if (updates.length === 0) return res.json(userToJSON(existing));

  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`).run(...params);
  const updated = db.prepare("SELECT * FROM users WHERE user_id = ?").get(id);
  res.json(userToJSON(updated));
});

router.delete("/:id", requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.user_id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }
  const existing = db.prepare("SELECT user_id FROM users WHERE user_id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });
  try {
    db.prepare("DELETE FROM users WHERE user_id = ?").run(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(409).json({ message: "Cannot delete: user has activity history" });
  }
});

export default router;
