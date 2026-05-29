const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Harus di-register TERAKHIR di Express app
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_ENTRY',
      message: 'Data sudah ada',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Data tidak ditemukan',
    });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.details[0].message,
      details: err.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // JWT errors (handled in middleware, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_INVALID',
      message: 'Token tidak valid',
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'Ukuran file terlalu besar (maksimal 5MB)',
    });
  }

  // Axios errors (external API)
  if (err.isAxiosError) {
    logger.error('External API error:', {
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
    });
    return res.status(502).json({
      success: false,
      error: 'EXTERNAL_API_ERROR',
      message: 'Layanan eksternal tidak tersedia. Coba lagi',
    });
  }

  // Known application errors
  const appErrors = {
    OTP_EXPIRED: { status: 400, message: 'Kode OTP sudah kedaluwarsa' },
    OTP_INVALID: { status: 400, message: 'Kode OTP tidak valid' },
    TOO_MANY_ATTEMPTS: { status: 429, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit' },
    KYC_NOT_VERIFIED: { status: 403, message: 'Harap selesaikan verifikasi identitas' },
    STORE_NOT_FOUND: { status: 404, message: 'Toko tidak ditemukan' },
    UNAUTHORIZED: { status: 401, message: 'Tidak terautentikasi' },
    FORBIDDEN: { status: 403, message: 'Akses ditolak' },
  };

  if (appErrors[err.message]) {
    const { status, message } = appErrors[err.message];
    return res.status(status).json({
      success: false,
      error: err.message,
      message,
    });
  }

  // Default 500
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: isDev ? err.message : 'Terjadi kesalahan server',
    ...(isDev && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
  });
}

module.exports = { errorHandler, notFoundHandler };
