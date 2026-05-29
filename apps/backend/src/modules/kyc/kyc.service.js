const prisma = require('../../config/database');
const verihubsService = require('./verihubs.service');
const logger = require('../../utils/logger');

/**
 * Upload KTP dan proses OCR
 */
async function uploadKtp(userId, ktpUrl, fileBuffer) {
  const imageBase64 = fileBuffer ? fileBuffer.toString('base64') : null;

  let ocrResult = null;
  if (imageBase64) {
    try {
      ocrResult = await verihubsService.ocrKtp(imageBase64);
    } catch (err) {
      logger.warn(`OCR KTP failed for user ${userId}:`, err.message);
    }
  }

  // Upsert KYC document
  const kycDoc = await prisma.kycDocument.upsert({
    where: { userId },
    update: {
      ktpUrl,
      nik: ocrResult?.nik,
      fullName: ocrResult?.name,
      dob: ocrResult?.dob,
      address: ocrResult?.address,
      status: 'SUBMITTED',
    },
    create: {
      userId,
      ktpUrl,
      selfieUrl: '', // akan diisi saat upload selfie
      nik: ocrResult?.nik,
      fullName: ocrResult?.name,
      dob: ocrResult?.dob,
      address: ocrResult?.address,
      status: 'SUBMITTED',
    },
  });

  return {
    kycId: kycDoc.id,
    ocrData: ocrResult
      ? {
          nik: ocrResult.nik,
          name: ocrResult.name,
          dob: ocrResult.dob,
        }
      : null,
  };
}

/**
 * Upload selfie dan proses face match
 */
async function uploadSelfie(userId, selfieUrl, selfieBuffer) {
  // Ambil KYC document yang sudah ada
  const kycDoc = await prisma.kycDocument.findUnique({ where: { userId } });

  if (!kycDoc || !kycDoc.ktpUrl) {
    throw new Error('Upload KTP terlebih dahulu sebelum selfie');
  }

  let faceMatchResult = null;
  if (selfieBuffer && kycDoc.ktpUrl) {
    try {
      // Untuk face match kita butuh base64 dari KTP juga
      // Dalam real implementation, ambil dari S3
      const selfieBase64 = selfieBuffer.toString('base64');
      faceMatchResult = await verihubsService.matchFace(
        '', // ktpBase64 — dalam prod ambil dari S3
        selfieBase64
      );
    } catch (err) {
      logger.warn(`Face match failed for user ${userId}:`, err.message);
    }
  }

  const newStatus =
    faceMatchResult?.passed === false ? 'REJECTED' : 'VERIFIED';

  // Update KYC document
  const updatedDoc = await prisma.kycDocument.update({
    where: { userId },
    data: {
      selfieUrl,
      similarity: faceMatchResult?.similarity,
      status: newStatus,
      reviewedAt: new Date(),
    },
  });

  // Update user KYC status
  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: newStatus },
  });

  logger.info(`KYC ${newStatus} for user ${userId} (similarity: ${faceMatchResult?.similarity})`);

  return {
    status: newStatus,
    similarity: faceMatchResult?.similarity,
    message:
      newStatus === 'VERIFIED'
        ? 'Verifikasi identitas berhasil!'
        : 'Verifikasi identitas gagal. Pastikan foto KTP dan selfie jelas.',
  };
}

/**
 * Get KYC status
 */
async function getKycStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });

  const kycDoc = await prisma.kycDocument.findUnique({
    where: { userId },
    select: {
      status: true,
      nik: true,
      fullName: true,
      reviewedAt: true,
      reviewNote: true,
    },
  });

  return {
    kycStatus: user.kycStatus,
    document: kycDoc,
  };
}

module.exports = { uploadKtp, uploadSelfie, getKycStatus };
