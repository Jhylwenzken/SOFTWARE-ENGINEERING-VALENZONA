import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware.js";

const router = Router();

router.get("/stock-logs", requireAuth, (req, res) => {
  const { menuId, limit = 50 } = req.query;
  let sql = `SELECT sl.*, mi.item_name, u.full_name AS user_full_name FROM stock_log sl JOIN menu_items mi ON sl.menu_id = mi.menu_id JOIN users u ON sl.user_id = u.user_id WHERE 1=1`;
  const params = [];
  if (menuId) { sql += " AND sl.menu_id = ?"; params.push(menuId); }
  sql += " ORDER BY sl.logged_at DESC LIMIT ?";
  params.push(Number(limit));
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((r) => ({
    logId: r.log_id,
    menuId: r.menu_id,
    itemName: r.item_name,
    changeAmount: r.change_amount,
    reason: r.reason,
    userId: r.user_id,
    userName: r.user_full_name,
    loggedAt: r.logged_at,
  })));
});

router.post("/stock-adjust", requireAdmin, (req, res) => {
  const { menuId, changeAmount, reason } = req.body || {};
  if (!menuId || !Number.isInteger(changeAmount) || !reason) {
    return res.status(400).json({ message: "menuId, integer changeAmount, and reason are required" });
  }
  const item = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(menuId);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  const newStock = item.stock_quantity + changeAmount;
  if (newStock < 0) return res.status(400).json({ message: "Stock cannot go negative" });
  db.transaction(() => {
    db.prepare("UPDATE menu_items SET stock_quantity = ? WHERE menu_id = ?").run(newStock, menuId);
    db.prepare(
      "INSERT INTO stock_log (menu_id, change_amount, reason, user_id) VALUES (?, ?, ?, ?)"
    ).run(menuId, changeAmount, reason, req.user.user_id);
  })();
  res.json({ menuId, newStock });
});

router.get("/low-stock", requireAuth, (req, res) => {
  const threshold = Number(req.query.threshold || 10);
  const rows = db.prepare("SELECT * FROM menu_items WHERE stock_quantity <= ? ORDER BY stock_quantity ASC").all(threshold);
  res.json(rows.map((m) => ({
    menuId: m.menu_id,
    itemName: m.item_name,
    stockQuantity: m.stock_quantity,
    category: m.category,
    status: m.status,
  })));
});

export default router;
