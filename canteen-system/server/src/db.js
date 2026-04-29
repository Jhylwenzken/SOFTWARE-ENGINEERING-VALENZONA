import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "canteen.db");

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.transaction = function (fn) {
  return (...args) => {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
};

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','staff')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','unavailable')),
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(user_id),
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending','completed','cancelled')),
      order_date TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_details (
      detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
      menu_id INTEGER NOT NULL REFERENCES menu_items(menu_id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
      total_amount REAL NOT NULL,
      sale_date TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_log (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL REFERENCES menu_items(menu_id),
      change_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(user_id),
      logged_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Archive tables to support force-deletes while preserving history
    CREATE TABLE IF NOT EXISTS order_details_archive (
      archive_id INTEGER PRIMARY KEY AUTOINCREMENT,
      detail_id INTEGER,
      order_id INTEGER,
      menu_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      subtotal REAL,
      archived_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_log_archive (
      archive_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER,
      menu_id INTEGER,
      change_amount INTEGER,
      reason TEXT,
      user_id INTEGER,
      logged_at TEXT,
      archived_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_order_details_order ON order_details(order_id);
    CREATE INDEX IF NOT EXISTS idx_stock_log_menu ON stock_log(menu_id);
  `);
}
