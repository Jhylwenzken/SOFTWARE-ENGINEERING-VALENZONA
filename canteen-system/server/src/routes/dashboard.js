import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/stats", requireAuth, (req, res) => {
  const totalMenuItems = db.prepare("SELECT COUNT(*) AS c FROM menu_items").get().c;
  const availableMenuItems = db.prepare("SELECT COUNT(*) AS c FROM menu_items WHERE status='available'").get().c;
  const ordersToday = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE DATE(order_date) = DATE('now')").get().c;
  const salesToday = db.prepare("SELECT COALESCE(SUM(total_amount),0) AS t FROM sales WHERE DATE(sale_date) = DATE('now')").get().t;
  const salesThisWeek = db.prepare("SELECT COALESCE(SUM(total_amount),0) AS t FROM sales WHERE sale_date >= DATETIME('now','-7 days')").get().t;
  const lowStockCount = db.prepare("SELECT COUNT(*) AS c FROM menu_items WHERE stock_quantity <= 10").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  res.json({ totalMenuItems, availableMenuItems, ordersToday, salesToday, salesThisWeek, lowStockCount, totalUsers });
});

router.get("/recent-activity", requireAuth, (req, res) => {
  const rows = db.prepare(`
    WITH recent AS (
      SELECT o.order_id, o.total_amount, o.status, o.order_date, u.full_name AS user_full_name
      FROM orders o JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC LIMIT 8
    )
    SELECT r.*, GROUP_CONCAT(mi.item_name || ' x' || od.quantity, ', ') AS items
    FROM recent r
    JOIN order_details od ON od.order_id = r.order_id
    JOIN menu_items mi ON mi.menu_id = od.menu_id
    GROUP BY r.order_id
    ORDER BY r.order_date DESC
  `).all();
  res.json(rows.map((o) => ({
    orderId: o.order_id,
    totalAmount: o.total_amount,
    status: o.status,
    orderDate: o.order_date,
    userName: o.user_full_name,
    items: o.items || "",
  })));
});

export default router;
