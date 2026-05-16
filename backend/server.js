require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const errorHandler = require('./modules/shared/middlewares/errorHandler');

const authRoutes = require('./modules/auth/routes/auth.routes');
const lmsRoutes = require('./modules/lms/routes/lms.routes');
const documentRoutes = require('./modules/documents/routes/document.routes');
const dashboardRoutes = require('./modules/shared/routes/dashboard.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');

const app = express();
const server = http.createServer(app);

// ── Initialize Socket.io ───────────────────────────────────────────────────────
initializeSocket(server);

// ── Connect to MongoDB ─────────────────────────────────────────────────────────
const { ensureIndexes } = require('./modules/lms/utils/ensureIndexes');
connectDB().then(() => ensureIndexes());

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiter ───────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── API Routes ─────────────────────────────────────────────────────────────────
const apiRouter = express.Router();


// Apply limiter to all API routes
apiRouter.use(limiter);

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ success: true, message: 'UOP API is running', timestamp: new Date().toISOString() });
});

// Module Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/lms', lmsRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/notifications', notificationRoutes);

// Mount API Router
app.use('/api', apiRouter);


// ── Catch-all 404 ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);


// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 UOP Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
});

module.exports = { app, server };
