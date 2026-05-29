const { getXenditClient } = require('../../config/xendit');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Generate QRIS Statis untuk toko via Xendit
 */
async function generateStaticQris(store) {
  const xendit = getXenditClient();

  if (!xendit) {
    logger.warn('Xendit not configured — using mock QRIS');
    const mockQris = `00020101021226670016ID.CO.QRIS.WWW011893600914${store.id.slice(0, 10)}0215ID.MOCK.BUKUPAY520400005303360540419995802ID5913${store.name.slice(0, 13).padEnd(13)}6013Jakarta Pusat61051234062070703A016304MOCK`;
    return {
      id: `mock_${store.id}`,
      qrString: mockQris,
      status: 'ACTIVE',
    };
  }

  try {
    const qrCode = await xendit.QrCode.createQRCode({
      referenceId: store.id,
      type: 'STATIC',
      currency: 'IDR',
      country: 'ID',
      metadata: {
        storeName: store.name,
        storeId: store.id,
        ownerId: store.ownerId,
      },
    });

    return {
      id: qrCode.id,
      qrString: qrCode.qr_string,
      status: qrCode.status,
    };
  } catch (err) {
    logger.error('Xendit QRIS generation error:', err.message);
    throw err;
  }
}

/**
 * Generate QRIS untuk store jika belum ada, simpan ke DB
 */
async function generateOrGetQris(storeId, userId) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: userId },
  });

  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // Sudah ada QRIS aktif
  if (store.qrisCode && store.isActive) {
    return {
      storeId: store.id,
      storeName: store.name,
      qrisCode: store.qrisCode,
      xenditQrisId: store.xenditQrisId,
      isActive: store.isActive,
    };
  }

  // Generate baru
  const qrResult = await generateStaticQris(store);

  // Update store
  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      qrisCode: qrResult.qrString,
      xenditQrisId: qrResult.id,
      isActive: true,
    },
  });

  logger.info(`QRIS generated for store ${storeId}: ${qrResult.id}`);

  return {
    storeId: updated.id,
    storeName: updated.name,
    qrisCode: updated.qrisCode,
    xenditQrisId: updated.xenditQrisId,
    isActive: updated.isActive,
  };
}

/**
 * Get QR code aktif untuk store
 */
async function getQrisForStore(storeId) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      qrisCode: true,
      qrisImageUrl: true,
      xenditQrisId: true,
      isActive: true,
      ownerId: true,
    },
  });

  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  return store;
}

module.exports = { generateOrGetQris, getQrisForStore };
