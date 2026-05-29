const kycService = require('./kyc.service');
const { memoryUpload } = require('../../middlewares/upload.middleware');
const logger = require('../../utils/logger');

/**
 * POST /kyc/upload-ktp
 */
async function uploadKtp(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'FILE_REQUIRED',
        message: 'File KTP wajib diupload',
      });
    }

    const ktpUrl = req.file.location || `local://${req.file.originalname}`;
    const result = await kycService.uploadKtp(req.user.id, ktpUrl, req.file.buffer);

    res.json({
      success: true,
      message: 'KTP berhasil diupload',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /kyc/upload-selfie
 */
async function uploadSelfie(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'FILE_REQUIRED',
        message: 'File selfie wajib diupload',
      });
    }

    const selfieUrl = req.file.location || `local://${req.file.originalname}`;
    const result = await kycService.uploadSelfie(req.user.id, selfieUrl, req.file.buffer);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /kyc/status
 */
async function getStatus(req, res, next) {
  try {
    const result = await kycService.getKycStatus(req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadKtp, uploadSelfie, getStatus };
