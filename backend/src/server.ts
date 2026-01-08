import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import glucoseRoutes from './routes/glucose.routes';
import coachRoutes from './routes/coach.routes';
import cycleRoutes from './routes/cycle.routes';
import symptomRoutes from './routes/symptom.routes';
import messagesRoutes from './routes/messages';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
//   credentials: true,
// }));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (like curl/postman) or no Origin
    if (!origin) return callback(null, true);

    // if no env set, allow all in dev
    if (!allowedOrigins?.length) return callback(null, true);

    // otherwise allow only listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/glucose', glucoseRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/cycle', cycleRoutes);
app.use('/api/v1/messages', messagesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
// const server = app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/health`);
// });

//bind express to network with 0.0.0.0 LAN on all interfaces
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Error handlers
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});