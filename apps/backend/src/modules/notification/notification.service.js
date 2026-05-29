const { getMessaging } = require('../../config/firebase');
const prisma = require('../../config/database');
const { formatRupiah } = require('../../utils/helpers');
const logger = require('../../utils/logger');

/**
 * Kirim notifikasi pembayaran ke merchant
 */
async function sendPaymentNotification({ tokens, amount, storeName, transactionId }) {
  const messaging = getMessaging();

  if (!messaging) {
    logger.warn('FCM not configured — skipping notification');
    return;
  }

  const title = '💰 Pembayaran Masuk!';
  const body = `${storeName} menerima pembayaran ${formatRupiah(amount)}`;

  const message = {
    notification: { title, body },
    data: {
      type: 'PAYMENT',
      transactionId,
      amount: String(amount),
      storeName,
    },
    android: {
      notification: {
        sound: 'payment_sound',
        channelId: 'payment_channel',
        priority: 'high',
      },
      priority: 'high',
    },
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`FCM sent: ${response.successCount}/${tokens.length} delivered`);

    // Hapus invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`FCM token failed: ${resp.error?.code}`);
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await prisma.fcmToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
        logger.info(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }
    }

    return response;
  } catch (err) {
    logger.error('FCM send error:', err.message);
    throw err;
  }
}

/**
 * Kirim notifikasi settlement selesai
 */
async function sendSettlementNotification({ tokens, amount, bankAccount }) {
  const messaging = getMessaging();
  if (!messaging) return;

  const maskedAccount = bankAccount.slice(-4);

  await messaging.sendEachForMulticast({
    notification: {
      title: '🏦 Dana Dicairkan',
      body: `${formatRupiah(amount)} berhasil dikirim ke rekening *${maskedAccount}`,
    },
    data: { type: 'SETTLEMENT', amount: String(amount) },
    tokens,
  });
}

/**
 * Register FCM token
 */
async function registerToken(userId, token, device = 'android') {
  await prisma.fcmToken.upsert({
    where: { token },
    update: { userId, device },
    create: { userId, token, device },
  });
}

module.exports = { sendPaymentNotification, sendSettlementNotification, registerToken };
