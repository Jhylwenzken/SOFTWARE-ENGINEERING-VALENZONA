import express from "express";
import cors from "cors";
import session from "express-session";
import { db, initSchema } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { loadUser } from "./middleware.js";
import authRouter from "./routes/auth.js";
import menuRouter from "./routes/menu.js";
import ordersRouter from "./routes/orders.js";
import salesRouter from "./routes/sales.js";
import inventoryRouter from "./routes/inventory.js";
import dashboardRouter from "./routes/dashboard.js";
import usersRouter from "./routes/users.js";

initSchema();
seedIfEmpty();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: corsOrigin.split(","),
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(loadUser);

app.get("/api/healthz", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/menu-items", menuRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sales", salesRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);

// Log registered routes for debugging (non-production helper)
function listRoutes() {
  try {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (!middleware.route && middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          const route = handler.route;
          if (route) {
            const methods = Object.keys(route.methods).join(',').toUpperCase();
            routes.push(`${methods} ${route.path}`);
          }
        });
      } else if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
        routes.push(`${methods} ${middleware.route.path}`);
      }
    });
    console.log('Registered routes:\n' + routes.join('\n'));
  } catch (e) {
    console.error('Failed to list routes', e);
  }
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

// Print routes then start server
listRoutes();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server listening on port ${PORT}`);
});
