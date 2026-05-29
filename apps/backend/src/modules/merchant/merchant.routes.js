const express = require('express');
const router = express.Router();
const merchantController = require('./merchant.controller');
const { authenticate, requireKyc } = require('../../middlewares/auth.middleware');

// Semua merchant routes butuh authentication
router.use(authenticate);

// GET /merchant/profile
router.get('/profile', merchantController.getProfile);

// POST /merchant/stores — butuh KYC
router.post('/stores', requireKyc, merchantController.createStore);

// GET /merchant/stores
router.get('/stores', merchantController.getStores);

// PUT /merchant/stores/:id
router.put('/stores/:id', requireKyc, merchantController.updateStore);

module.exports = router;
