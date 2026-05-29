const express = require('express');
const router = express.Router();
const kycController = require('./kyc.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { memoryUpload } = require('../../middlewares/upload.middleware');

// Semua KYC routes butuh authentication
router.use(authenticate);

// POST /kyc/upload-ktp
router.post('/upload-ktp', memoryUpload.single('ktp'), kycController.uploadKtp);

// POST /kyc/upload-selfie
router.post('/upload-selfie', memoryUpload.single('selfie'), kycController.uploadSelfie);

// GET /kyc/status
router.get('/status', kycController.getStatus);

module.exports = router;
