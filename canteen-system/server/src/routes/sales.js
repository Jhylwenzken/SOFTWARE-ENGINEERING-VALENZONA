import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT s.*, o.user_id, u.full_name AS user_full_name FROM sales s JOIN orders o ON s.order_id = o.order_id JOIN users u ON o.user_id = u.user_id WHERE 1=1`;
  const params = [];
  if (from) { sql += " AND s.sale_date >= ?"; params.push(from); }
  if (to) { sql += " AND s.sale_date <= ?"; params.push(to); }
  sql += " ORDER BY s.sale_date DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((s) => ({
    saleId: s.sale_id,
    orderId: s.order_id,
    totalAmount: s.total_amount,
    saleDate: s.sale_date,
    userName: s.user_full_name,
  })));
});

router.get("/summary", requireAuth, (req, res) => {
  const { from, to } = req.query;
  let where = "WHERE 1=1";
  const params = [];
  if (from) { where += " AND sale_date >= ?"; params.push(from); }
  if (to) { where += " AND sale_date <= ?"; params.push(to); }
  const totals = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total FROM sales ${where}`).get(...params);
  const byDay = db.prepare(`
    SELECT DATE(sale_date) AS day, COUNT(*) AS count, SUM(total_amount) AS total
    FROM sales ${where}
    GROUP BY DATE(sale_date) ORDER BY day
  `).all(...params);
  res.json({
    totalSales: totals.total,
    totalTransactions: totals.count,
    byDay: byDay.map((r) => ({ day: r.day, count: r.count, total: r.total })),
  });
});

router.get("/top-items", requireAuth, (req, res) => {
  const { from, to, limit = 5 } = req.query;
  let where = "WHERE 1=1";
  const params = [];
  if (from) { where += " AND s.sale_date >= ?"; params.push(from); }
  if (to) { where += " AND s.sale_date <= ?"; params.push(to); }
  const rows = db.prepare(`
    SELECT mi.menu_id, mi.item_name, SUM(od.quantity) AS quantity_sold, SUM(od.subtotal) AS revenue
    FROM sales s
    JOIN order_details od ON od.order_id = s.order_id
    JOIN menu_items mi ON mi.menu_id = od.menu_id
    ${where}
    GROUP BY mi.menu_id, mi.item_name
    ORDER BY quantity_sold DESC
    LIMIT ?
  `).all(...params, Number(limit));
  res.json(rows.map((r) => ({
    menuId: r.menu_id,
    itemName: r.item_name,
    quantitySold: r.quantity_sold,
    revenue: r.revenue,
  })));
});

export default router;
