import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

function getOrderWithDetails(orderId) {
  const order = db.prepare(`
    SELECT o.*, u.full_name AS user_full_name, u.username AS user_username
    FROM orders o JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `).get(orderId);
  if (!order) return null;
  const details = db.prepare(`
    SELECT od.*, mi.item_name
    FROM order_details od JOIN menu_items mi ON od.menu_id = mi.menu_id
    WHERE od.order_id = ?
  `).all(orderId);
  return {
    orderId: order.order_id,
    userId: order.user_id,
    userName: order.user_full_name,
    totalAmount: order.total_amount,
    status: order.status,
    orderDate: order.order_date,
    details: details.map((d) => ({
      detailId: d.detail_id,
      menuId: d.menu_id,
      itemName: d.item_name,
      quantity: d.quantity,
      unitPrice: d.unit_price,
      subtotal: d.subtotal,
    })),
  };
}

router.get("/", requireAuth, (req, res) => {
  const { status, limit } = req.query;
  let sql = `SELECT o.*, u.full_name AS user_full_name FROM orders o JOIN users u ON o.user_id = u.user_id WHERE 1=1`;
  const params = [];
  if (status) { sql += " AND o.status = ?"; params.push(status); }
  sql += " ORDER BY o.order_date DESC";
  if (limit) { sql += " LIMIT ?"; params.push(Number(limit)); }
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((o) => ({
    orderId: o.order_id,
    userId: o.user_id,
    userName: o.user_full_name,
    totalAmount: o.total_amount,
    status: o.status,
    orderDate: o.order_date,
  })));
});

router.get("/:id", requireAuth, (req, res) => {
  const out = getOrderWithDetails(req.params.id);
  if (!out) return res.status(404).json({ message: "Not found" });
  res.json(out);
});

router.post("/", requireAuth, (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order must contain at least one item" });
  }
  const userId = req.user.user_id;

  try {
    const result = db.transaction(() => {
      let total = 0;
      const lines = [];
      for (const it of items) {
        const menu = db.prepare("SELECT * FROM menu_items WHERE menu_id = ?").get(it.menuId);
        if (!menu) throw new Error(`Item ${it.menuId} not found`);
        if (menu.status !== "available") throw new Error(`${menu.item_name} is unavailable`);
        if (menu.stock_quantity < it.quantity) throw new Error(`Not enough stock for ${menu.item_name}`);
        const subtotal = menu.price * it.quantity;
        total += subtotal;
        lines.push({ menu, quantity: it.quantity, subtotal });
      }
      const orderId = db.prepare(
        "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'completed')"
      ).run(userId, total).lastInsertRowid;
      const insertDetail = db.prepare(
        "INSERT INTO order_details (order_id, menu_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)"
      );
      const updateStock = db.prepare("UPDATE menu_items SET stock_quantity = stock_quantity - ? WHERE menu_id = ?");
      const insertLog = db.prepare(
        "INSERT INTO stock_log (menu_id, change_amount, reason, user_id) VALUES (?, ?, ?, ?)"
      );
      for (const ln of lines) {
        insertDetail.run(orderId, ln.menu.menu_id, ln.quantity, ln.menu.price, ln.subtotal);
        updateStock.run(ln.quantity, ln.menu.menu_id);
        insertLog.run(ln.menu.menu_id, -ln.quantity, `Order #${orderId}`, userId);
      }
      db.prepare("INSERT INTO sales (order_id, total_amount) VALUES (?, ?)").run(orderId, total);
      return orderId;
    })();

    res.status(201).json(getOrderWithDetails(result));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.patch("/:id/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const existing = db.prepare("SELECT * FROM orders WHERE order_id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });
  db.prepare("UPDATE orders SET status = ? WHERE order_id = ?").run(status, req.params.id);
  res.json(getOrderWithDetails(req.params.id));
});

export default router;
