const express = require('express');
const router = express.Router();
const settlementController = require('./settlement.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

// GET /settlements/balance — saldo yang belum dicairkan
router.get('/balance', settlementController.getBalance);

// GET /settlements — riwayat pencairan
router.get('/', settlementController.getSettlements);

module.exports = router;
