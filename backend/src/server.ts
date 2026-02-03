// // import express from 'express';
// // import helmet from 'helmet';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import authRoutes from './routes/auth.routes';
// // import glucoseRoutes from './routes/glucose.routes';
// // import coachRoutes from './routes/coach.routes';
// // import cycleRoutes from './routes/cycle.routes';
// // import symptomRoutes from './routes/symptom.routes';
// // import messagesRoutes from './routes/messages';
// // import groupRoutes from './routes/group.routes';

// // dotenv.config();

// // const app = express();
// // const PORT = process.env.PORT || 3000;

// // // Middleware
// // // app.use(helmet());
// // // app.use(cors({
// // //   origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
// // //   credentials: true,
// // // }));

// // const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim());

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     // allow non-browser requests (like curl/postman) or no Origin
// //     if (!origin) return callback(null, true);

// //     // if no env set, allow all in dev
// //     if (!allowedOrigins?.length) return callback(null, true);

// //     // otherwise allow only listed origins
// //     if (allowedOrigins.includes(origin)) return callback(null, true);

// //     return callback(new Error(`CORS blocked for origin: ${origin}`));
// //   },
// //   credentials: true,
// // }));

// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // Health check
// // app.get('/health', (req, res) => {
// //   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// // });

// // // Routes
// // app.use('/api/v1/auth', authRoutes);
// // app.use('/api/v1/glucose', glucoseRoutes);
// // app.use('/api/v1/coach', coachRoutes);
// // app.use('/api/v1/symptoms', symptomRoutes);
// // app.use('/api/v1/cycle', cycleRoutes);
// // app.use('/api/v1/messages', messagesRoutes);
// // app.use('/api/v1/groups', groupRoutes);

// // // 404 handler
// // app.use((req, res) => {
// //   res.status(404).json({ error: 'Route not found' });
// // });

// // // Error handler
// // app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
// //   console.error('Error:', err);
// //   res.status(err.status || 500).json({
// //     error: err.message || 'Internal server error',
// //   });
// // });

// // // Start server
// // // const server = app.listen(PORT, () => {
// // //   console.log(`🚀 Server running on http://localhost:${PORT}`);
// // //   console.log(`📊 Health check: http://localhost:${PORT}/health`);
// // // });

// // //bind express to network with 0.0.0.0 LAN on all interfaces
// // const server = app.listen(Number(PORT), '0.0.0.0', () => {
// //   console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
// //   console.log(`📊 Health check: http://localhost:${PORT}/health`);
// // });

// // // Error handlers
// // server.on('error', (err) => {
// //   console.error('❌ Server error:', err);
// //   process.exit(1);
// // });

// // process.on('uncaughtException', (err) => {
// //   console.error('❌ Uncaught exception:', err);
// //   process.exit(1);
// // });

// // process.on('unhandledRejection', (err) => {
// //   console.error('❌ Unhandled rejection:', err);
// //   process.exit(1);
// // });



// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes from './routes/auth.routes';
// import glucoseRoutes from './routes/glucose.routes';
// import coachRoutes from './routes/coach.routes';
// import cycleRoutes from './routes/cycle.routes';
// import symptomRoutes from './routes/symptom.routes';
// import messagesRoutes from './routes/messages';
// import groupRoutes from './routes/group.routes';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // ==================== CORS CONFIGURATION ====================
// // Supports: Mobile App (Expo), Web App (Browser), and Production deployments

// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [
//   // Development - Local
//   'http://localhost:3001',           // Web app dev server (Vite)
//   'http://localhost:19006',          // Expo web dev
//   'http://localhost:19000',          // Expo dev server
//   'http://127.0.0.1:3001',           // Web app alternate
  
//   // Development - Network (for testing on devices)
//   'exp://192.168.1.*',               // Expo on local network (wildcard pattern)
//   'exp://localhost:8081',            // Expo Metro bundler
  
//   // Production - Add your deployed URLs here
//   // 'https://graceflow-web.vercel.app',
//   // 'https://glucose-tracker-web.vercel.app',
//   // 'https://app.graceflow.com',
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (mobile apps, Postman, curl, etc.)
//     if (!origin) {
//       return callback(null, true);
//     }

//     // Check if origin matches any allowed origin (including wildcards)
//     const isAllowed = allowedOrigins.some(allowedOrigin => {
//       // Exact match
//       if (allowedOrigin === origin) {
//         return true;
//       }
      
//       // Wildcard pattern match (e.g., exp://192.168.1.*)
//       if (allowedOrigin.includes('*')) {
//         const pattern = allowedOrigin.replace(/\./g, '\\.').replace(/\*/g, '.*');
//         const regex = new RegExp(`^${pattern}$`);
//         return regex.test(origin);
//       }
      
//       return false;
//     });

//     if (isAllowed) {
//       callback(null, true);
//     } else {
//       console.warn(`⚠️  CORS blocked for origin: ${origin}`);
//       callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// // Security headers (commented out helmet for development flexibility)
// // Uncomment in production:
// // app.use(helmet());

// // Body parsers
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Request logging (development)
// if (process.env.NODE_ENV !== 'production') {
//   app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
//     next();
//   });
// }

// // ==================== ROUTES ====================

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'ok', 
//     timestamp: new Date().toISOString(),
//     version: '1.0.0',
//     environment: process.env.NODE_ENV || 'development',
//   });
// });

// // API Routes
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/glucose', glucoseRoutes);
// app.use('/api/v1/coach', coachRoutes);
// app.use('/api/v1/symptoms', symptomRoutes);
// app.use('/api/v1/cycle', cycleRoutes);
// app.use('/api/v1/messages', messagesRoutes);
// app.use('/api/v1/groups', groupRoutes);

// // ==================== ERROR HANDLERS ====================

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ 
//     error: 'Route not found',
//     path: req.path,
//     method: req.method,
//   });
// });

// // Global error handler
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('❌ Error:', err);
  
//   // CORS errors
//   if (err.message.includes('CORS')) {
//     return res.status(403).json({
//       error: 'CORS policy violation',
//       message: err.message,
//     });
//   }
  
//   // Other errors
//   res.status(err.status || 500).json({
//     error: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
//   });
// });

// // ==================== SERVER STARTUP ====================

// // Bind to all network interfaces (0.0.0.0) for LAN access
// const server = app.listen(Number(PORT), '0.0.0.0', () => {
//   console.log('');
//   console.log('🌿 ====================================');
//   console.log('   GraceFlow Backend Server Started');
//   console.log('🌿 ====================================');
//   console.log('');
//   console.log(`🚀 Server:       http://0.0.0.0:${PORT}`);
//   console.log(`🏠 Localhost:    http://localhost:${PORT}`);
//   console.log(`📊 Health Check: http://localhost:${PORT}/health`);
//   console.log(`🌐 API Base:     http://localhost:${PORT}/api/v1`);
//   console.log('');
//   console.log('📱 Allowed Origins:');
//   allowedOrigins.forEach(origin => {
//     console.log(`   ✓ ${origin}`);
//   });
//   console.log('');
//   console.log('🔧 Environment:  ' + (process.env.NODE_ENV || 'development'));
//   console.log('');
//   console.log('Ready to accept requests! 🎉');
//   console.log('');
// });

// // ==================== PROCESS ERROR HANDLERS ====================

// server.on('error', (err: any) => {
//   if (err.code === 'EADDRINUSE') {
//     console.error(`❌ Port ${PORT} is already in use!`);
//     console.error(`   Try: lsof -ti:${PORT} | xargs kill -9`);
//   } else {
//     console.error('❌ Server error:', err);
//   }
//   process.exit(1);
// });

// process.on('uncaughtException', (err) => {
//   console.error('❌ Uncaught exception:', err);
//   console.error('Stack:', err.stack);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('❌ Unhandled rejection at:', promise);
//   console.error('Reason:', reason);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('');
//   console.log('📴 SIGTERM received. Shutting down gracefully...');
//   server.close(() => {
//     console.log('✅ Server closed');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.log('');
//   console.log('📴 SIGINT received. Shutting down gracefully...');
//   server.close(() => {
//     console.log('✅ Server closed');
//     process.exit(0);
//   });
// });

// export default app;


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
    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
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

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/glucose", glucoseRoutes);
app.use("/api/v1/coach", coachRoutes);
app.use("/api/v1/symptoms", symptomRoutes);
app.use("/api/v1/cycles", cycleRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/groups", groupRoutes);

// ==================== ERROR HANDLERS ====================
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Error:", err?.message || err);

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
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed origins from env: ${allowedList.length ? allowedList.join(", ") : "(none)"}`);
  console.log(`✅ Also allowing: *.vercel.app`);
});

// Process error handlers
server.on("error", (err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  process.exit(1);
});

export default app;