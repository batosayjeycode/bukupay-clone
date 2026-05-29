const prisma = require('../../config/database');
const { Queue } = require('bullmq');
const { bullmqRedisConfig } = require('../../config/redis');
const logger = require('../../utils/logger');

const settlementQueue = new Queue('settlement', { connection: bullmqRedisConfig });

/**
 * Get saldo pending (belum dicairkan) untuk semua toko user
 */
async function getPendingBalance(userId) {
  const userStores = await prisma.store.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true },
  });

  const storeIds = userStores.map((s) => s.id);

  // Hitung total transaksi PAID yang belum ada settlement
  const result = await prisma.transaction.aggregate({
    where: {
      storeId: { in: storeIds },
      status: 'PAID',
    },
    _sum: { netAmount: true },
  });

  // Hitung total yang sudah ada settlement pending/processing
  const settledResult = await prisma.settlement.aggregate({
    where: {
      storeId: { in: storeIds },
      status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
    },
    _sum: { amount: true },
  });

  const totalEarned = result._sum.netAmount || 0;
  const totalSettled = settledResult._sum.amount || 0;
  const availableBalance = Math.max(0, totalEarned - totalSettled);

  return {
    availableBalance,
    totalEarned,
    totalSettled,
    stores: userStores,
  };
}

/**
 * Get riwayat settlement
 */
async function getSettlements({ userId, storeId, status, page = 1, limit = 20 }) {
  const userStores = await prisma.store.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const storeIds = userStores.map((s) => s.id);

  const where = {
    storeId: storeId ? storeId : { in: storeIds },
    ...(status && { status }),
  };

  const [settlements, total] = await Promise.all([
    prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { store: { select: { name: true } } },
    }),
    prisma.settlement.count({ where }),
  ]);

  return {
    settlements,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get pending settlements (untuk BullMQ scheduler)
 */
async function getPendingSettlements() {
  return prisma.settlement.findMany({
    where: { status: 'PENDING' },
    include: { store: true },
  });
}

/**
 * Update settlement status
 */
async function updateSettlementStatus(settlementId, status, xenditDisbId = null, failReason = null) {
  return prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status,
      xenditDisbId,
      failReason,
      processedAt: ['COMPLETED', 'FAILED'].includes(status) ? new Date() : undefined,
    },
  });
}

/**
 * Queue settlement job
 */
async function queueSettlement(settlementData) {
  const job = await settlementQueue.add('process', settlementData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
  logger.info(`Settlement job queued: ${job.id} for settlement ${settlementData.settlementId}`);
  return job;
}

module.exports = {
  getPendingBalance,
  getSettlements,
  getPendingSettlements,
  updateSettlementStatus,
  queueSettlement,
};
