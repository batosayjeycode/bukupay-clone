const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

// GET /transactions — list dengan filter
router.get('/', transactionController.getTransactions);

// GET /transactions/:id — detail
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
