require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const logger = require('./utils/logger');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');

// Routes — Phase 1
const authRoutes = require('./modules/auth/auth.routes');
const kycRoutes = require('./modules/kyc/kyc.routes');
const merchantRoutes = require('./modules/merchant/merchant.routes');
const qrisRoutes = require('./modules/qris/qris.routes');
const transactionRoutes = require('./modules/transaction/transaction.routes');
const settlementRoutes = require('./modules/settlement/settlement.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

// Routes — Phase 2
const soundboxRoutes = require('./modules/soundbox/soundbox.routes');
const employeeRoutes = require('./modules/employee/employee.routes');
const reportRoutes = require('./modules/report/report.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Webhook
const { verifyXenditWebhook, handlePaymentWebhook } = require('./webhooks/xendit.controller');

const app = express();

// ============================================================
// Security Middlewares
// ============================================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for API
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-callback-token'],
  })
);

// ============================================================
// Request Parsing
// ============================================================

// Webhook endpoint — perlu raw body untuk signature verification
app.post(
  '/webhooks/xendit',
  express.raw({ type: 'application/json' }),
  verifyXenditWebhook,
  handlePaymentWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ============================================================
// Logging
// ============================================================
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// ============================================================
// Health Check
// ============================================================
app.get('/health', (req, res) => {
  const { isConnected } = require('./config/mqtt');
  res.json({
    status: 'ok',
    app: 'BukuPay API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mqtt: isConnected() ? 'connected' : 'disconnected',
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api', apiLimiter);

// Phase 1
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/qris', qrisRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notification', notificationRoutes);

// Phase 2
app.use('/api/soundbox', soundboxRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// Error Handling
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
