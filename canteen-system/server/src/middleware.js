import { db } from "./db.js";

export function loadUser(req, res, next) {
  const userId = req.session?.userId;
  if (userId) {
    const user = db.prepare("SELECT user_id, username, full_name, role, created_at FROM users WHERE user_id = ?").get(userId);
    if (user) req.user = user;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

export function userToJSON(u) {
  return {
    userId: u.user_id,
    username: u.username,
    fullName: u.full_name,
    role: u.role,
    createdAt: u.created_at,
  };
}

export function menuToJSON(m) {
  return {
    menuId: m.menu_id,
    itemName: m.item_name,
    description: m.description,
    price: m.price,
    category: m.category,
    stockQuantity: m.stock_quantity,
    status: m.status,
    imageUrl: m.image_url,
    createdAt: m.created_at,
  };
}
