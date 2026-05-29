const transactionService = require('../modules/transaction/transaction.service');
const logger = require('../utils/logger');

/**
 * Middleware: verifikasi signature Xendit webhook
 */
function verifyXenditWebhook(req, res, next) {
  const token = req.headers['x-callback-token'];

  if (!process.env.XENDIT_WEBHOOK_TOKEN) {
    logger.warn('XENDIT_WEBHOOK_TOKEN not set — skipping verification (dev mode)');
    return next();
  }

  if (!token || token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    logger.warn(`Invalid Xendit webhook token from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

/**
 * POST /webhooks/xendit — terima notifikasi pembayaran
 */
async function handlePaymentWebhook(req, res) {
  const body = req.body;

  logger.info('Xendit webhook received:', {
    type: body.event,
    referenceId: body.reference_id,
    status: body.status,
    amount: body.amount,
  });

  // Hanya proses event pembayaran QRIS yang COMPLETED
  if (body.event !== 'qr.payment' && body.event !== 'qr_code.payment_received') {
    return res.status(200).json({ received: true, processed: false });
  }

  if (body.status !== 'COMPLETED' && body.status !== 'SUCCEEDED') {
    return res.status(200).json({ received: true, processed: false, status: body.status });
  }

  try {
    const transaction = await transactionService.recordPayment({
      referenceId: body.reference_id,
      amount: body.amount,
      xenditId: body.id,
      payerInfo: body.payer_info || null,
    });

    // Phase 2: Publish ke MQTT Soundbox (fire and forget — tidak block response)
    if (transaction?.storeId) {
      publishToSoundbox(transaction.storeId, transaction.amount).catch((err) => {
        logger.warn('[Webhook] MQTT publish failed (non-critical):', err.message);
      });
    }

    res.status(200).json({
      received: true,
      processed: true,
      transactionId: transaction?.id,
    });
  } catch (err) {
    logger.error('Webhook processing error:', err.message);
    // Kembalikan 200 agar Xendit tidak retry terus
    res.status(200).json({ received: true, processed: false, error: err.message });
  }
}

/**
 * Publish payment event ke MQTT soundbox device yang terdaftar di toko
 * @param {string} storeId
 * @param {number} amount
 */
async function publishToSoundbox(storeId, amount) {
  const prisma = require('../config/database');
  const { publishPayment, isConnected } = require('../config/mqtt');

  if (!isConnected()) return;

  // Cari semua soundbox online di toko ini
  const devices = await prisma.soundboxDevice.findMany({
    where: { storeId, isOnline: true },
    include: { store: { select: { name: true } } },
  });

  for (const device of devices) {
    publishPayment(device.deviceId, {
      amount,
      storeName: device.store?.name || 'BukuPay',
      timestamp: Date.now(),
    });
    logger.debug('[Webhook] MQTT published to device:', device.deviceId, 'amount:', amount);
  }
}

module.exports = { verifyXenditWebhook, handlePaymentWebhook };
