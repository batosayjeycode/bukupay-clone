const { Worker, Queue } = require('bullmq');
const { bullmqRedisConfig } = require('../config/redis');
const { getXenditClient } = require('../config/xendit');
const settlementService = require('../modules/settlement/settlement.service');
const notificationService = require('../modules/notification/notification.service');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const cron = require('node-cron');

// Queue untuk settlement (dipakai di service juga)
const settlementQueue = new Queue('settlement', { connection: bullmqRedisConfig });

/**
 * Proses satu settlement via Xendit Disbursement
 */
async function processSettlement(job) {
  const { settlementId, storeId, amount, bankCode, bankAccount, accountName } = job.data;

  logger.info(`Processing settlement ${settlementId}: Rp ${amount} -> ${bankCode} ${bankAccount}`);

  // Update status ke PROCESSING
  await settlementService.updateSettlementStatus(settlementId, 'PROCESSING');

  const xendit = getXenditClient();

  if (!xendit) {
    logger.warn('Xendit not configured — simulating settlement success');
    await settlementService.updateSettlementStatus(settlementId, 'COMPLETED', `mock_disb_${settlementId}`);
    return;
  }

  try {
    const disbursement = await xendit.Disbursement.create({
      externalId: settlementId,
      amount,
      bankCode,
      accountHolderName: accountName,
      accountNumber: bankAccount,
      description: `BukuPay Pencairan Dana - ${new Date().toLocaleDateString('id-ID')}`,
    });

    await settlementService.updateSettlementStatus(
      settlementId,
      'COMPLETED',
      disbursement.id
    );

    logger.info(`Settlement ${settlementId} completed: ${disbursement.id}`);

    // Kirim notifikasi FCM ke merchant
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { include: { fcmTokens: true } } },
    });

    if (store?.owner?.fcmTokens?.length > 0) {
      const tokens = store.owner.fcmTokens.map((t) => t.token);
      await notificationService.sendSettlementNotification({ tokens, amount, bankAccount });
    }
  } catch (err) {
    logger.error(`Settlement ${settlementId} failed:`, err.message);
    await settlementService.updateSettlementStatus(
      settlementId,
      'FAILED',
      null,
      err.message
    );
    throw err; // BullMQ akan retry
  }
}

/**
 * BullMQ Worker
 */
const settlementWorker = new Worker('settlement', processSettlement, {
  connection: bullmqRedisConfig,
  concurrency: 5,
});

settlementWorker.on('completed', (job) => {
  logger.info(`Settlement job ${job.id} completed`);
});

settlementWorker.on('failed', (job, err) => {
  logger.error(`Settlement job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
});

/**
 * Schedule: jalankan 3x sehari — 10:00, 15:00, 20:00 WIB (UTC+7 = 03:00, 08:00, 13:00 UTC)
 */
function startSettlementScheduler() {
  cron.schedule('0 3,8,13 * * *', async () => {
    logger.info('Running settlement scheduler...');

    try {
      const pendingSettlements = await settlementService.getPendingSettlements();
      logger.info(`Found ${pendingSettlements.length} pending settlements`);

      for (const settlement of pendingSettlements) {
        const store = await prisma.store.findUnique({ where: { id: settlement.storeId } });

        if (!store) continue;

        // Cari bank account utama merchant
        const bankAccount = await prisma.bankAccount.findFirst({
          where: { userId: store.ownerId, isPrimary: true },
        });

        if (!bankAccount) {
          logger.warn(`No primary bank account for store ${settlement.storeId}`);
          continue;
        }

        await settlementService.queueSettlement({
          settlementId: settlement.id,
          storeId: settlement.storeId,
          amount: settlement.amount,
          bankCode: bankAccount.bankCode,
          bankAccount: bankAccount.accountNo,
          accountName: bankAccount.accountName,
        });
      }
    } catch (err) {
      logger.error('Settlement scheduler error:', err.message);
    }
  });

  logger.info('✅ Settlement scheduler started (10:00, 15:00, 20:00 WIB)');
}

module.exports = { settlementWorker, settlementQueue, startSettlementScheduler };
