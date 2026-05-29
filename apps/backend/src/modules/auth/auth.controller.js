const Joi = require('joi');
const otpService = require('./otp.service');
const jwtService = require('./jwt.service');
const { normalizePhone } = require('../../utils/helpers');
const logger = require('../../utils/logger');

const requestOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+62|62|0)[0-9]{9,13}$/)
    .required()
    .messages({
      'string.pattern.base': 'Nomor telepon tidak valid. Gunakan format 08xxx atau +628xxx',
      'any.required': 'Nomor telepon wajib diisi',
    }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Kode OTP harus 6 digit',
    'string.pattern.base': 'Kode OTP hanya boleh angka',
  }),
});

/**
 * POST /auth/request-otp
 */
async function requestOtp(req, res, next) {
  try {
    const { error, value } = requestOtpSchema.validate(req.body);
    if (error) return next(error);

    const phone = normalizePhone(value.phone);
    const result = await otpService.sendOtp(phone);

    res.json({
      success: true,
      message: `Kode OTP telah dikirim via ${result.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`,
      data: {
        channel: result.channel,
        expiresIn: result.expiresIn,
        phone: phone.slice(0, 5) + '****' + phone.slice(-4),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) return next(error);

    const phone = normalizePhone(value.phone);
    await otpService.verifyOtp(phone, value.otp);

    const authResult = await jwtService.loginOrRegister(phone);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: authResult,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/refresh
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Refresh token diperlukan',
      });
    }

    const result = await jwtService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await jwtService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout-all
 * Require authentication
 */
async function logoutAll(req, res, next) {
  try {
    await jwtService.revokeAllSessions(req.user.id);

    res.json({
      success: true,
      message: 'Semua sesi telah diakhiri',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { requestOtp, verifyOtp, refreshToken, logout, logoutAll };
