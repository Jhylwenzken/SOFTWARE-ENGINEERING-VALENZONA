# CampusCanteen — Canteen Information System

A web-based Canteen Information System with POS, menu management, orders, sales reports, inventory, and user management.

## Tech Stack

- **Frontend:** React + Vite, MUI Material, React Router, Axios, Recharts (port 5000)
- **Backend:** Node.js, Express, built-in SQLite (`node:sqlite`), express-session, bcryptjs, cors (port 3001)
- **Node.js:** Requires v22.5+ for built-in SQLite support

## Project Structure

```
canteen-system/
├── client/       # React + Vite frontend (port 5000)
│   ├── src/
│   ├── vite.config.js
│   └── package.json
└── server/       # Express API + SQLite DB (port 3001)
    ├── src/
    │   ├── index.js      # Entry point
    │   ├── db.js         # SQLite schema
    │   ├── seed.js       # Initial data seeding
    │   ├── middleware.js  # Auth middleware
    │   └── routes/       # API route handlers
    └── package.json
```

## Running Locally

Two workflows are configured:
- **Backend Server** — runs `node --experimental-sqlite src/index.js` on port 3001
- **Start application** — runs `npm run dev` (Vite) on port 5000; proxies `/api/*` to backend

## Default Login Credentials

| Role  | Username   | Password    |
|-------|------------|-------------|
| Admin | `admin`    | `admin`     |
| Staff | `staff`    | `staff123`  |
| Staff | `cashier2` | `cashier123`|

## Modules

- **Login** — session-based auth with role separation (admin / staff)
- **Dashboard** — KPI overview, recent activity, and sales trends
- **POS** — cashier workflow for placing orders and deducting stock
- **Menu Management** — admin CRUD for menu items
- **Orders** — filter and review order records
- **Sales** — daily summary, top sellers, transaction history
- **Inventory** — stock adjustment with reason logging
- **Users** — admin manages staff accounts

## User Preferences

- Currency: Philippine Peso (₱)
- Language: JavaScript (no TypeScript)
