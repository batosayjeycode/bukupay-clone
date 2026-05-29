const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPEG, PNG, atau WebP yang diperbolehkan'), false);
  }
}

/**
 * Upload KYC documents ke S3
 */
const kycUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET || 'bukupay-kyc',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const userId = req.user?.id || 'unknown';
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const fieldName = file.fieldname; // 'ktp' or 'selfie'
      const key = `kyc/${userId}/${fieldName}_${uuidv4()}${ext}`;
      logger.info(`Uploading KYC file: ${key}`);
      cb(null, key);
    },
    acl: 'private',
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Upload to memory (untuk base64 conversion ke Verihubs)
 */
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { kycUpload, memoryUpload, s3Client };
