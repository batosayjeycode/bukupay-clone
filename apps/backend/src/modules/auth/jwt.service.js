const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../config/database');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const REFRESH_TOKEN_TTL_DAYS = 30;

/**
 * Generate access + refresh token pair
 */
function generateTokens(user) {
  const payload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
    issuer: 'bukupay',
  });

  const refreshToken = jwt.sign({ userId: user.id, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
    issuer: 'bukupay',
  });

  return { accessToken, refreshToken };
}

/**
 * Login / register user setelah OTP verified
 * Buat user jika belum ada
 */
async function loginOrRegister(phone) {
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: { phone, role: 'OWNER', kycStatus: 'PENDING' },
    });
    logger.info(`New user registered: ${user.id}`);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { accessToken, refreshToken } = generateTokens(user);

  // Simpan refresh token ke DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      kycStatus: user.kycStatus,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token menggunakan refresh token
 */
async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('REFRESH_TOKEN_INVALID');
  }

  // Cek di database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  const { user } = storedToken;
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

  // Rotate refresh token
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: refreshToken } }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      kycStatus: user.kycStatus,
      role: user.role,
    },
  };
}

/**
 * Logout — hapus refresh token dari DB
 */
async function logout(refreshToken) {
  if (!refreshToken) return;

  try {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
  } catch {
    // Token tidak ditemukan, biarkan
  }
}

/**
 * Revoke semua session (logout semua device)
 */
async function revokeAllSessions(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  logger.info(`All sessions revoked for user: ${userId}`);
}

module.exports = { loginOrRegister, refreshAccessToken, logout, revokeAllSessions };
