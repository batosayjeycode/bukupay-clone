const prisma = require('../../config/database');
const { calculateMdrFee } = require('../../utils/helpers');
const notificationService = require('../notification/notification.service');
const logger = require('../../utils/logger');

/**
 * Record pembayaran dari webhook Xendit
 */
async function recordPayment({ referenceId, amount, xenditId, payerInfo }) {
  // Cari store berdasarkan reference_id (= storeId)
  const store = await prisma.store.findUnique({
    where: { id: referenceId },
    include: { owner: { select: { id: true, fcmTokens: true } } },
  });

  if (!store) {
    logger.warn(`Store not found for reference_id: ${referenceId}`);
    return null;
  }

  const fee = calculateMdrFee(amount);
  const netAmount = amount - fee;

  // Cek duplikat
  const existing = await prisma.transaction.findUnique({ where: { xenditId } });
  if (existing) {
    logger.warn(`Duplicate transaction: ${xenditId}`);
    return existing;
  }

  const transaction = await prisma.transaction.create({
    data: {
      storeId: store.id,
      amount,
      fee,
      netAmount,
      status: 'PAID',
      xenditId,
      payerInfo: payerInfo || null,
      paidAt: new Date(),
    },
  });

  logger.info(`Payment recorded: ${transaction.id} — Rp ${amount} for store ${store.id}`);

  // Kirim notifikasi FCM
  try {
    const fcmTokens = store.owner.fcmTokens.map((t) => t.token);
    if (fcmTokens.length > 0) {
      await notificationService.sendPaymentNotification({
        tokens: fcmTokens,
        amount,
        storeName: store.name,
        transactionId: transaction.id,
      });
    }
  } catch (notifErr) {
    logger.error('FCM notification failed:', notifErr.message);
    // Jangan throw — transaksi sudah tercatat
  }

  return transaction;
}

/**
 * List transaksi dengan filter
 */
async function getTransactions({ userId, storeId, status, startDate, endDate, page = 1, limit = 20 }) {
  // Verifikasi akses ke store
  const where = {};

  if (storeId) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: userId },
    });
    if (!store) throw new Error('STORE_NOT_FOUND');
    where.storeId = storeId;
  } else {
    // Ambil semua transaksi dari store milik user
    const userStores = await prisma.store.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    where.storeId = { in: userStores.map((s) => s.id) };
  }

  if (status) where.status = status;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        store: { select: { name: true, city: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Detail transaksi
 */
async function getTransactionById(transactionId, userId) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      store: {
        select: { id: true, name: true, address: true, city: true, ownerId: true },
      },
    },
  });

  if (!transaction) {
    throw new Error('TRANSACTION_NOT_FOUND');
  }

  // Verifikasi akses
  if (transaction.store.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  return transaction;
}

module.exports = { recordPayment, getTransactions, getTransactionById };
