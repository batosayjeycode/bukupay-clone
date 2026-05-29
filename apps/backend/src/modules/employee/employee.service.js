const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const { generateOtp } = require('../../utils/helpers');
const { normalizePhone } = require('../../utils/helpers');
const logger = require('../../utils/logger');

// Kirim WhatsApp invite link (reuse OTP WhatsApp service)
async function sendWhatsAppInvite(phone, storeName, token) {
  const axios = require('axios');
  const inviteUrl = `${process.env.APP_DEEP_LINK || 'https://app.bukupay.id'}/join/${token}`;
  const message = `Halo! Anda diundang menjadi kasir di *${storeName}*.\n\nKlik link berikut untuk bergabung:\n${inviteUrl}\n\nLink berlaku 24 jam.`;

  const waApiKey = process.env.WA_API_KEY;
  const waApiUrl = process.env.WA_API_URL;

  if (!waApiKey || !waApiUrl) {
    logger.warn('[Employee] WhatsApp not configured — invite link:', inviteUrl);
    return { sent: false, inviteUrl }; // Kembalikan link saja
  }

  try {
    await axios.post(
      waApiUrl,
      { phone: normalizePhone(phone), message },
      { headers: { Authorization: `Bearer ${waApiKey}` }, timeout: 10000 }
    );
    return { sent: true, inviteUrl };
  } catch (err) {
    logger.error('[Employee] WhatsApp invite failed:', err.message);
    return { sent: false, inviteUrl };
  }
}

/**
 * Pemilik mengundang karyawan ke toko
 * @param {string} ownerId
 * @param {string} storeId
 * @param {string} phone - nomor karyawan
 * @param {Object} permissions - { canRefund, canViewReport, canManageEmployees }
 */
async function inviteEmployee(ownerId, storeId, phone, permissions = {}) {
  // Validasi toko milik owner
  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId },
  });
  if (!store) throw new Error('STORE_NOT_FOUND');

  const normalizedPhone = normalizePhone(phone);

  // Cek apakah karyawan sudah ada
  const existingUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

  if (existingUser) {
    const alreadyEmployee = await prisma.storeEmployee.findFirst({
      where: { storeId, userId: existingUser.id },
    });
    if (alreadyEmployee) throw new Error('ALREADY_EMPLOYEE');
  }

  // Generate invite token
  const { randomUUID } = require('crypto');
  const inviteToken = randomUUID();
  const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  // Simpan invite di DB
  // Jika user sudah ada: buat/update storeEmployee dengan token
  // Jika belum: simpan token di temporary store (bisa di Redis)
  const redis = require('../../config/redis').redis;
  await redis.setex(
    `invite:${inviteToken}`,
    86400, // 24 jam
    JSON.stringify({
      storeId,
      ownerId,
      phone: normalizedPhone,
      permissions: {
        canRefund: permissions.canRefund ?? false,
        canViewReport: permissions.canViewReport ?? false,
        canManageEmployees: permissions.canManageEmployees ?? false,
      },
    })
  );

  // Kirim WhatsApp
  const waResult = await sendWhatsAppInvite(phone, store.name, inviteToken);

  logger.info('[Employee] Invite sent to:', normalizedPhone, 'store:', storeId);

  return {
    inviteToken,
    inviteExpiry,
    inviteUrl: waResult.inviteUrl,
    whatsappSent: waResult.sent,
  };
}

/**
 * Karyawan accept invite
 * @param {string} userId - user yang menerima (sudah login)
 * @param {string} token - invite token dari link
 */
async function joinStore(userId, token) {
  const redis = require('../../config/redis').redis;
  const inviteData = await redis.get(`invite:${token}`);

  if (!inviteData) throw new Error('INVITE_EXPIRED');

  const { storeId, ownerId, phone, permissions } = JSON.parse(inviteData);

  // Verifikasi nomor phone cocok
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.phone !== phone) throw new Error('PHONE_MISMATCH');

  // Cek belum jadi employee
  const existing = await prisma.storeEmployee.findFirst({
    where: { storeId, userId },
  });
  if (existing) throw new Error('ALREADY_EMPLOYEE');

  const employee = await prisma.storeEmployee.create({
    data: {
      storeId,
      userId,
      role: 'EMPLOYEE',
      permissions,
      inviteToken: token,
      joinedAt: new Date(),
    },
    include: { store: { select: { name: true, id: true } } },
  });

  // Hapus token dari Redis
  await redis.del(`invite:${token}`);

  logger.info('[Employee] User', userId, 'joined store:', storeId);
  return employee;
}

/**
 * List karyawan di toko
 * @param {string} ownerId
 * @param {string} storeId
 */
async function getEmployees(ownerId, storeId) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId } });
  if (!store) throw new Error('STORE_NOT_FOUND');

  return prisma.storeEmployee.findMany({
    where: { storeId },
    include: {
      // Ambil info user tapi exclude sensitive fields
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Update permissions karyawan
 * @param {string} ownerId
 * @param {string} employeeId - storeEmployee.id
 * @param {Object} permissions
 */
async function updatePermissions(ownerId, employeeId, permissions) {
  const employee = await prisma.storeEmployee.findFirst({
    where: { id: employeeId },
    include: { store: true },
  });

  if (!employee || employee.store.ownerId !== ownerId) {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }

  return prisma.storeEmployee.update({
    where: { id: employeeId },
    data: { permissions },
  });
}

/**
 * Set PIN kasir (oleh owner atau kasir itu sendiri)
 * @param {string} requesterId - owner atau employee userId
 * @param {string} employeeId - storeEmployee.id
 * @param {string} pin - 6 digit
 */
async function setPin(requesterId, employeeId, pin) {
  if (!/^\d{6}$/.test(pin)) throw new Error('PIN_INVALID_FORMAT');

  const employee = await prisma.storeEmployee.findFirst({
    where: { id: employeeId },
    include: { store: true },
  });

  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');

  // Hanya owner atau karyawan itu sendiri yang bisa set PIN
  const isOwner = employee.store.ownerId === requesterId;
  const isSelf = employee.userId === requesterId;
  if (!isOwner && !isSelf) throw new Error('FORBIDDEN');

  const pinHash = await bcrypt.hash(pin, 10);

  return prisma.storeEmployee.update({
    where: { id: employeeId },
    data: { pinHash },
  });
}

/**
 * Login kasir via PIN (bukan OTP)
 * @param {string} storeId
 * @param {string} phone - nomor kasir
 * @param {string} pin - 6 digit
 * @returns {Object} employee + store info + short-lived JWT
 */
async function pinLogin(storeId, phone, pin) {
  const normalizedPhone = normalizePhone(phone);
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const employee = await prisma.storeEmployee.findFirst({
    where: { storeId, userId: user.id },
    include: { store: { select: { name: true, id: true, qrisCode: true } } },
  });

  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');
  if (!employee.pinHash) throw new Error('PIN_NOT_SET');

  const valid = await bcrypt.compare(pin, employee.pinHash);
  if (!valid) throw new Error('PIN_INVALID');

  // Generate short JWT untuk kasir (8 jam / 1 shift)
  const { signAccessToken } = require('../auth/jwt.service');
  const token = signAccessToken(
    { id: user.id, role: 'EMPLOYEE', storeId, permissions: employee.permissions },
    '8h'
  );

  logger.info('[Employee] Kasir PIN login:', user.phone, 'store:', storeId);

  return {
    token,
    employee: {
      id: employee.id,
      store: employee.store,
      permissions: employee.permissions,
    },
  };
}

/**
 * Hapus karyawan dari toko
 * @param {string} ownerId
 * @param {string} employeeId - storeEmployee.id
 */
async function removeEmployee(ownerId, employeeId) {
  const employee = await prisma.storeEmployee.findFirst({
    where: { id: employeeId },
    include: { store: true },
  });

  if (!employee || employee.store.ownerId !== ownerId) {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }

  await prisma.storeEmployee.delete({ where: { id: employeeId } });
  logger.info('[Employee] Removed employee:', employeeId, 'from store:', employee.storeId);
}

/**
 * Ringkasan shift kasir hari ini
 * @param {string} userId - kasir
 * @param {string} storeId
 */
async function getShiftSummary(userId, storeId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [summary] = await prisma.transaction.groupBy({
    by: ['storeId'],
    where: {
      storeId,
      status: 'PAID',
      paidAt: { gte: today, lt: tomorrow },
    },
    _sum: { amount: true, netAmount: true },
    _count: { id: true },
  });

  return {
    date: today.toISOString().slice(0, 10),
    totalRevenue: summary?._sum.amount || 0,
    netRevenue: summary?._sum.netAmount || 0,
    txCount: summary?._count.id || 0,
  };
}

module.exports = {
  inviteEmployee,
  joinStore,
  getEmployees,
  updatePermissions,
  setPin,
  pinLogin,
  removeEmployee,
  getShiftSummary,
};
