const prisma = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Admin: list semua merchant (paginated)
 */
async function listMerchants(params = {}) {
  const { page = 1, limit = 20, search, kycStatus } = params;
  const skip = (page - 1) * limit;

  const where = {
    role: 'OWNER',
    ...(search && {
      OR: [
        { phone: { contains: search } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(kycStatus && { kycStatus }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        stores: { select: { id: true, name: true, isActive: true } },
        kycDocument: { select: { status: true, similarity: true } },
        _count: { select: { stores: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    merchants: users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Admin: statistik global platform
 */
async function getGlobalStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalMerchants,
    verifiedMerchants,
    todayTx,
    totalRevenue,
    activeSoundboxes,
    pendingKyc,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'OWNER' } }),
    prisma.user.count({ where: { role: 'OWNER', kycStatus: 'VERIFIED' } }),
    prisma.transaction.aggregate({
      where: { status: 'PAID', paidAt: { gte: today } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.transaction.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.soundboxDevice.count({ where: { isOnline: true } }),
    prisma.kycDocument.count({ where: { status: 'SUBMITTED' } }),
  ]);

  return {
    totalMerchants,
    verifiedMerchants,
    pendingKyc,
    activeSoundboxes,
    today: {
      revenue: todayTx._sum.amount || 0,
      txCount: todayTx._count.id || 0,
    },
    allTime: {
      revenue: totalRevenue._sum.amount || 0,
    },
  };
}

/**
 * Admin: detail merchant + statistik
 */
async function getMerchantDetail(merchantId) {
  const user = await prisma.user.findUnique({
    where: { id: merchantId },
    include: {
      stores: {
        include: {
          soundboxes: true,
          _count: { select: { transactions: true, employees: true } },
        },
      },
      kycDocument: true,
      bankAccounts: true,
    },
  });

  if (!user) throw new Error('MERCHANT_NOT_FOUND');

  // Revenue stats
  const revenue = await prisma.transaction.aggregate({
    where: { store: { ownerId: merchantId }, status: 'PAID' },
    _sum: { amount: true, netAmount: true },
    _count: { id: true },
  });

  return { ...user, revenue };
}

/**
 * Admin: suspend/unsuspend merchant
 */
async function toggleMerchantStatus(adminId, merchantId, isActive, reason) {
  const merchant = await prisma.user.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new Error('MERCHANT_NOT_FOUND');

  await prisma.user.update({
    where: { id: merchantId },
    data: { isActive },
  });

  // Log aksi admin
  await prisma.adminLog.create({
    data: {
      adminId,
      action: isActive ? 'UNSUSPEND_MERCHANT' : 'SUSPEND_MERCHANT',
      targetType: 'USER',
      targetId: merchantId,
      metadata: { reason, merchantPhone: merchant.phone },
    },
  });

  logger.info(`[Admin] ${isActive ? 'Unsuspended' : 'Suspended'} merchant:`, merchantId, 'by admin:', adminId);

  return { success: true, isActive };
}

/**
 * Admin: manual approve/reject KYC
 */
async function reviewKyc(adminId, merchantId, status, note) {
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  const [kycDoc, user] = await Promise.all([
    prisma.kycDocument.findUnique({ where: { userId: merchantId } }),
    prisma.user.findUnique({ where: { id: merchantId } }),
  ]);

  if (!kycDoc || !user) throw new Error('MERCHANT_NOT_FOUND');

  await prisma.$transaction([
    prisma.kycDocument.update({
      where: { userId: merchantId },
      data: { status, reviewNote: note, reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: merchantId },
      data: { kycStatus: status },
    }),
    prisma.adminLog.create({
      data: {
        adminId,
        action: `KYC_${status}`,
        targetType: 'USER',
        targetId: merchantId,
        metadata: { note, merchantPhone: user.phone },
      },
    }),
  ]);

  logger.info(`[Admin] KYC ${status} for merchant:`, merchantId, 'by admin:', adminId);
  return { success: true, status };
}

/**
 * Admin: activity logs
 */
async function getAdminLogs(params = {}) {
  const { page = 1, limit = 50 } = params;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.adminLog.count(),
  ]);

  return { logs, pagination: { total, page, limit } };
}

module.exports = {
  listMerchants,
  getGlobalStats,
  getMerchantDetail,
  toggleMerchantStatus,
  reviewKyc,
  getAdminLogs,
};
