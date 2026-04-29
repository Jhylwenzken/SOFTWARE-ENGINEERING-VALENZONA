import bcrypt from "bcryptjs";
import { db } from "./db.js";

export function seedIfEmpty() {
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (userCount > 0) return;

  console.log("Seeding canteen database...");

  const insertUser = db.prepare(
    "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)"
  );
  const adminId = insertUser.run("admin", bcrypt.hashSync("admin", 10), "Jhylewenz Ken", "admin").lastInsertRowid;
  const staffId = insertUser.run("staff", bcrypt.hashSync("staff123", 10), "Juan Dela Cruz", "staff").lastInsertRowid;
  insertUser.run("cashier2", bcrypt.hashSync("cashier123", 10), "Ana Reyes", "staff");

  const items = [
    { name: "Chicken Adobo", desc: "Classic Filipino braised chicken in soy and vinegar.", price: 75, cat: "Main Dish", stock: 40, img: "/menu/adobo.png" },
    { name: "Pancit Palabok", desc: "Rice noodles with shrimp sauce, egg, and chicharon.", price: 65, cat: "Main Dish", stock: 30, img: "/menu/palabok.png" },
    { name: "Lumpiang Shanghai", desc: "Crispy pork spring rolls (5 pieces).", price: 50, cat: "Snack", stock: 50, img: "/menu/lumpia.png" },
    { name: "Pancit Canton", desc: "Stir-fried wheat noodles with vegetables.", price: 60, cat: "Main Dish", stock: 35, img: "/menu/pancit-canton.png" },
    { name: "Siomai (4 pcs)", desc: "Steamed pork dumplings with soy-calamansi sauce.", price: 35, cat: "Snack", stock: 60, img: "/menu/siomai.png" },
    { name: "Halo-Halo", desc: "Mixed sweet beans, fruits, leche flan, and shaved ice.", price: 80, cat: "Dessert", stock: 25, img: "/menu/halo-halo.png" },
    { name: "Garlic Fried Rice", desc: "Sinangag — fragrant garlic rice.", price: 30, cat: "Side", stock: 80, img: "/menu/fried-rice.png" },
    { name: "Banana Cue", desc: "Caramelized fried saba banana on a stick.", price: 20, cat: "Snack", stock: 4, img: "/menu/banana-cue.png" },
    { name: "Bottled Water", desc: "500ml mineral water.", price: 15, cat: "Beverage", stock: 60, img: null },
    { name: "Iced Tea", desc: "House-brewed lemon iced tea.", price: 25, cat: "Beverage", stock: 45, img: null },
    { name: "Calamansi Juice", desc: "Fresh-squeezed Filipino lime juice.", price: 25, cat: "Beverage", stock: 30, img: null },
    { name: "Turon", desc: "Fried banana spring roll with brown sugar.", price: 18, cat: "Dessert", stock: 40, img: null },
  ];

  const insertItem = db.prepare(
    "INSERT INTO menu_items (item_name, description, price, category, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const itemIds = items.map((it) =>
    insertItem.run(it.name, it.desc, it.price, it.cat, it.stock, it.img).lastInsertRowid
  );

  const insertOrder = db.prepare(
    "INSERT INTO orders (user_id, total_amount, status, order_date) VALUES (?, ?, 'completed', ?)"
  );
  const insertDetail = db.prepare(
    "INSERT INTO order_details (order_id, menu_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)"
  );
  const insertSale = db.prepare(
    "INSERT INTO sales (order_id, total_amount, sale_date) VALUES (?, ?, ?)"
  );

  const now = new Date();
  const sampleOrders = [
    { daysAgo: 0, lines: [[0, 1], [6, 1]] },
    { daysAgo: 0, lines: [[2, 2], [9, 1]] },
    { daysAgo: 1, lines: [[1, 1], [8, 1]] },
    { daysAgo: 2, lines: [[3, 1], [4, 2]] },
    { daysAgo: 3, lines: [[5, 1]] },
    { daysAgo: 4, lines: [[0, 2], [6, 2], [9, 2]] },
    { daysAgo: 6, lines: [[7, 3], [11, 2]] },
  ];

  for (const o of sampleOrders) {
    const date = new Date(now.getTime() - o.daysAgo * 86400000);
    const dateStr = date.toISOString().slice(0, 19).replace("T", " ");
    let total = 0;
    const linesData = o.lines.map(([idx, qty]) => {
      const it = items[idx];
      const subtotal = it.price * qty;
      total += subtotal;
      return { menuId: itemIds[idx], qty, price: it.price, subtotal };
    });
    const userId = o.daysAgo % 2 === 0 ? staffId : adminId;
    const orderId = insertOrder.run(userId, total, dateStr).lastInsertRowid;
    for (const ld of linesData) {
      insertDetail.run(orderId, ld.menuId, ld.qty, ld.price, ld.subtotal);
    }
    insertSale.run(orderId, total, dateStr);
  }

  const insertLog = db.prepare(
    "INSERT INTO stock_log (menu_id, change_amount, reason, user_id) VALUES (?, ?, ?, ?)"
  );
  insertLog.run(itemIds[0], 50, "Initial stock", adminId);
  insertLog.run(itemIds[1], 30, "Initial stock", adminId);
  insertLog.run(itemIds[7], -10, "Damaged stock removed", adminId);
  insertLog.run(itemIds[2], 20, "Restock", adminId);
  insertLog.run(itemIds[5], 25, "Initial stock", adminId);

  console.log("Seed complete.");
}
