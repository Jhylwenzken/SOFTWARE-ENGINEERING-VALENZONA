import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin, menuToJSON } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const { category, status } = req.query;
  let sql = "SELECT * FROM menu_items WHERE 1=1";
  const params = [];
  if (category) { sql += " AND category = ?"; params.push(category); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY menu_id DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(menuToJSON));
});

router.get("/:id", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json(menuToJSON(row));
});

router.post("/", requireAdmin, (req, res) => {
  const { itemName, description, price, category, stockQuantity, status, imageUrl } = req.body || {};
  if (!itemName || price == null || !category) return res.status(400).json({ message: "Missing required fields" });
  const result = db.prepare(
    "INSERT INTO menu_items (item_name, description, price, category, stock_quantity, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(itemName, description ?? null, price, category, stockQuantity ?? 0, status || "available", imageUrl ?? null);
  const row = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(result.lastInsertRowid);
  res.status(201).json(menuToJSON(row));
});

router.patch("/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });
  const fields = ["itemName", "description", "price", "category", "stockQuantity", "status", "imageUrl"];
  const cols = { itemName: "item_name", description: "description", price: "price", category: "category", stockQuantity: "stock_quantity", status: "status", imageUrl: "image_url" };
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${cols[f]} = ?`); params.push(req.body[f]); }
  }
  if (updates.length === 0) return res.json(menuToJSON(existing));
  params.push(req.params.id);
  db.prepare(`UPDATE menu_items SET ${updates.join(", ")} WHERE menu_id = ?`).run(...params);
  const row = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(req.params.id);
  res.json(menuToJSON(row));
});

router.delete("/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });
  try {
    db.prepare("DELETE FROM menu_items WHERE menu_id = ?").run(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(409).json({ message: "Cannot delete: item has order history. Mark as unavailable instead." });
  }
});

// Admin force-delete: archive dependent rows then remove the menu item
router.post("/:id/force", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Not found" });
  try {
    db.transaction(() => {
      // Archive order_details
      const odRows = db.prepare("SELECT * FROM order_details WHERE menu_id = ?").all(id);
      const insertOd = db.prepare(
        "INSERT INTO order_details_archive (detail_id, order_id, menu_id, quantity, unit_price, subtotal, archived_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
      );
      for (const r of odRows) insertOd.run(r.detail_id, r.order_id, r.menu_id, r.quantity, r.unit_price, r.subtotal);
      db.prepare("DELETE FROM order_details WHERE menu_id = ?").run(id);

      // Archive stock_log
      const slRows = db.prepare("SELECT * FROM stock_log WHERE menu_id = ?").all(id);
      const insertSl = db.prepare(
        "INSERT INTO stock_log_archive (log_id, menu_id, change_amount, reason, user_id, logged_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
      );
      for (const s of slRows) insertSl.run(s.log_id, s.menu_id, s.change_amount, s.reason, s.user_id, s.logged_at);
      db.prepare("DELETE FROM stock_log WHERE menu_id = ?").run(id);

      // Finally remove the menu item
      db.prepare("DELETE FROM menu_items WHERE menu_id = ?").run(id);
    })();
    res.json({ message: "Force deleted and archived dependent history" });
  } catch (e) {
    res.status(500).json({ message: "Force delete failed", error: e.message });
  }
});

export default router;
