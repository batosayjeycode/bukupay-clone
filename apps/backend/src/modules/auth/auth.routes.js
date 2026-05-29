const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { otpLimiter, authLimiter } = require('../../middlewares/rateLimit.middleware');

// POST /auth/request-otp — kirim OTP
router.post('/request-otp', otpLimiter, authController.requestOtp);

// POST /auth/verify-otp — verifikasi OTP + login
router.post('/verify-otp', authLimiter, authController.verifyOtp);

// POST /auth/refresh — refresh access token
router.post('/refresh', authController.refreshToken);

// POST /auth/logout
router.post('/logout', authController.logout);

// POST /auth/logout-all — logout semua device (butuh auth)
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;
