# Canteen Information System (Capstone)

A web-based Canteen Information System with POS, menu management, orders, sales reports, inventory, and user management. Built with React + Vite (frontend) and Express + SQLite (backend).

## Tech Stack

- **Frontend:** Vite, React (JavaScript, no TypeScript), MUI Material, React Router, Axios, Recharts
- **Backend:** Node.js, Express, `node:sqlite` (built-in), express-session, bcryptjs, cors
- **Dev:** nodemon

## Requirements

- **Node.js v22.5.0 or newer** (uses Node's built-in SQLite — no native compile needed)
- npm (comes with Node)

Check your version:
```
node --version
```

If you need to install/upgrade Node, download the LTS from https://nodejs.org

## Project Structure

```
canteen-system/
├── server/          # Express API + SQLite DB
│   ├── src/
│   ├── package.json
│   └── canteen.db   (auto-created on first run)
└── client/          # React + Vite frontend
    ├── src/
    ├── public/
    ├── index.html
    └── package.json
```

## Setup (one-time)

Open the project in VS Code, then open two integrated terminals.

**Terminal 1 — Server:**
```
cd server
npm install
```

**Terminal 2 — Client:**
```
cd client
npm install
```

## Running the App

**Terminal 1 — Server (port 3001):**
```
cd server
npm run dev
```
On first run the database `canteen.db` is created and seeded with sample users, menu items, orders, and stock data.

**Terminal 2 — Client (port 5000):**
```
cd client
npm run dev
```

Open http://localhost:5000 in your browser. The Vite dev server proxies `/api/*` calls to the backend on port 3001.

## Default Login Credentials

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `admin` |
| Staff | `staff`  | `staff123` |
| Staff | `cashier2` | `cashier123` |

## Modules

- **Login** — session-based auth with role separation (admin / staff)
- **Dashboard** — KPI overview, recent activity, and sales trends
- **POS (Point of Sale)** — cashier workflow for placing orders and deducting stock
- **Menu Management** — admin can add/edit menu items and update availability; delete is blocked for items with order history, so use unavailable when an item should no longer be sold
- **Orders** — review and filter order records with line items
- **Sales** — sales summary by day, top-selling items, and transaction history
- **Inventory** — adjust stock levels with reason logging and view stock history
- **Users** — admin manages staff accounts (create, change role, reset password, delete)

Currency is Philippine Peso (₱).

## System Flow

1. A user signs in and the session stores their role.
2. The app routes access based on that role, so admin-only actions stay behind admin checks.
3. Staff mainly use POS to create orders, which reduces stock and writes stock-log entries.
4. Admins manage menu items, inventory, sales, and user accounts from the management pages.
5. Menu items with existing order history should be marked unavailable instead of deleted, so historical reports stay consistent.

## Sharing Locally with ngrok (optional)

To let classmates test from outside your network:

1. Install ngrok: https://ngrok.com/download
2. Start both servers as above, or run the helper from the repo root:
   ```
   run-all.bat
   ```
3. Share the generated `https://*.ngrok-free.app` URL.

> Note: With ngrok, the API proxy still goes through the Vite dev server on the host machine, so only the host needs Node installed.

## Production Build (optional)

To build the frontend as static files:
```
cd client
npm run build
```
Output is in `client/dist/`. You can serve those files with any static host or have the Express server serve them.

## Resetting the Database

Stop the server, delete `server/canteen.db` (and any `*-journal`, `*-wal`, `*-shm` files), then restart `npm run dev` — it will re-seed automatically.

## Troubleshooting

- **`SyntaxError: Unknown module 'node:sqlite'`** — Your Node is too old. Upgrade to v22.5+ (LTS recommended).
- **`ExperimentalWarning: SQLite is an experimental feature`** — This is expected and harmless on Node 22/23/24.
- **Port already in use** — Another process is on 3001 or 5000. Stop it, or change the port in `server/src/index.js` / `client/vite.config.js`.
- **Login does nothing** — Make sure the server terminal shows `API server listening on port 3001` before logging in. Check the browser DevTools Network tab for the `/api/auth/login` request.
