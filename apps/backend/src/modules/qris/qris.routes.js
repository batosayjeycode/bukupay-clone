const express = require('express');
const router = express.Router();
const qrisController = require('./qris.controller');
const { authenticate, requireKyc } = require('../../middlewares/auth.middleware');

router.use(authenticate);

// POST /qris/generate — generate QRIS statis (butuh KYC)
router.post('/generate', requireKyc, qrisController.generateQris);

// GET /qris/:storeId — get QR code aktif
router.get('/:storeId', qrisController.getQris);

module.exports = router;
