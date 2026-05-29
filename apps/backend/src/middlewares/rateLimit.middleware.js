const rateLimit = require('express-rate-limit');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 menit per IP
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Terlalu banyak permintaan. Coba lagi nanti',
  },
});

/**
 * OTP rate limiter
 * Max 5 request OTP per 15 menit per IP
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:ip:${req.ip}`,
  message: {
    success: false,
    error: 'OTP_RATE_LIMIT',
    message: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit',
  },
  handler: (req, res, next, options) => {
    logger.warn(`OTP rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * Auth endpoint limiter (login/verify)
 * 20 requests per 15 menit
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT',
    message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit',
  },
});

module.exports = { apiLimiter, otpLimiter, authLimiter };
