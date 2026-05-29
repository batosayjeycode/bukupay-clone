const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware: verifikasi JWT access token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token akses diperlukan',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Sesi Anda telah berakhir, silakan login ulang',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'TOKEN_INVALID',
        message: 'Token tidak valid',
      });
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        kycStatus: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Akun tidak ditemukan atau tidak aktif',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan server',
    });
  }
}

/**
 * Middleware: cek KYC sudah verified
 */
function requireKyc(req, res, next) {
  if (req.user.kycStatus !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      error: 'KYC_NOT_VERIFIED',
      message: 'Harap selesaikan verifikasi identitas terlebih dahulu',
    });
  }
  next();
}

/**
 * Middleware: cek role (ADMIN only)
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Akses ditolak',
    });
  }
  next();
}

module.exports = { authenticate, requireKyc, requireAdmin };
