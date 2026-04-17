// backend/src/server.ts

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
import conversationRoutes from "./routes/conversation.routes";
import groupMessageRoutes from "./routes/group_message_routes";
import lessonRoutes from "./routes/lesson.routes";
import notificationRoutes from "./routes/notifications.routes";

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
    // Allow server-to-server (no origin) and Expo dev clients
    if (!origin) return cb(null, true);

    if (allowedList.includes(origin)) return cb(null, true);

    // Only allow *.vercel.app if it was explicitly added to ALLOWED_ORIGINS
    // Removed the wildcard — any Vercel project would have had access otherwise
    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}

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
    server: "backend/src/server.ts ✅",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/", (_req, res) =>
  res.json({ status: "ok", service: "glucose-tracker-api" })
);

app.get("/api/v1", (_req, res) =>
  res.json({ status: "ok", api: "v1" })
);


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/glucose", glucoseRoutes);
app.use("/api/v1/coach", coachRoutes);
app.use("/api/v1/symptoms", symptomRoutes);
app.use("/api/v1/cycle", cycleRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/group-messages", groupMessageRoutes);
app.use("/api/v1/lessons", lessonRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/group-messages", groupMessageRoutes);
app.use("/api/v1/group/:groupId/messages", groupMessageRoutes); // nested route for group messages  

// ==================== ERROR HANDLERS ====================
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: any,
    _req: express.Request | any /* for auth middleware */,
    res: express.Response | any /* for auth middleware */,
    _next: express.NextFunction
  ) => {
    console.error("❌ Error:", err?.message || err);

    if (String(err?.message || "").toLowerCase().includes("cors")) {
      return res.status(403).json({ error: err.message });
    }

    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  }
);

// ==================== START SERVER ====================

// Determine base URL (prod vs local)
const getBaseUrl = () => {
  if (process.env.BASE_URL) return process.env.BASE_URL;

  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }

  return `http://localhost:${PORT}`;
};

const BASE_URL = getBaseUrl();

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🩺 Health check: ${BASE_URL}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 CORS origins: ${process.env.ALLOWED_ORIGINS}`);
});

export default app;