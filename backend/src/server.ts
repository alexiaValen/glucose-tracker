//backend/src/server.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import glucoseRoutes from "./routes/glucose.routes";
import coachRoutes from "./routes/coach.routes";
import cycleRoutes from "./routes/cycle.routes";
import symptomRoutes from "./routes/symptom.routes";
import messagesRoutes from "./routes/messages";
import groupRoutes from "./routes/group.routes";



dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CORS ====================
const allowedList = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no Origin (Postman, curl, mobile, server-to-server)
    if (!origin) return cb(null, true);

    // Allow explicit origins from env
    if (allowedList.includes(origin)) return cb(null, true);

    // Allow all Vercel preview + prod domains
    if (origin.endsWith(".vercel.app")) return cb(null, true);

    // Otherwise block
    console.warn(`âš ï¸ CORS blocked for origin: ${origin}`);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Handle OPTIONS preflight for all routes

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In production you can enable helmet (safe default)
// If it ever causes issues, we can tune it.
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}

// Dev request logging (optional)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path} - origin: ${req.headers.origin || "none"}`);
    next();
  });
}

// ==================== ROUTES ====================
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

//root sanity check
app.get("/", (_req, res) => res.json({ status: "ok", service: "glucose-tracker-api" }));

//api mount sanity check
app.get("/api/v1", (_req, res) => res.json({ status: "ok", api: "v1" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/glucose", glucoseRoutes);
app.use("/api/v1/coach", coachRoutes);
app.use("/api/v1/symptoms", symptomRoutes);
app.use("/api/v1/cycle", cycleRoutes);  // FIXED: singular to match mobile app
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/groups", groupRoutes);

// ==================== ERROR HANDLERS ====================
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("âŒ Error:", err?.message || err);

  // CORS errors
  if (String(err?.message || "").toLowerCase().includes("cors")) {
    return res.status(403).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ==================== START SERVER ====================
const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`ðŸš€ Server running on http://0.0.0.0:${PORT}`);
  console.log(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
  console.log(`ðŸŒ Allowed origins from env: ${allowedList.length ? allowedList.join(", ") : "(none)"}`);
  console.log(`âœ… Also allowing: *.vercel.app`);
});

// Process error handlers
server.on("error", (err) => {
  console.error("âŒ Server error:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("âŒ Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("âŒ Unhandled rejection:", err);
  process.exit(1);
});

export default app;