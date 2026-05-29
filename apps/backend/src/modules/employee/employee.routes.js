const express = require('express');
const router = express.Router();
const { authenticate, requireKyc } = require('../../middlewares/auth.middleware');
const controller = require('./employee.controller');

// PIN login tidak butuh auth (kasir belum punya token)
router.post('/pin-login', controller.pinLogin);

// Semua routes lainnya butuh auth
router.use(authenticate);

// Join via invite link (butuh login tapi tidak butuh KYC sebelumnya)
router.post('/join', controller.join);

// Routes yang butuh KYC
router.use(requireKyc);

router.post('/invite', controller.invite);
router.get('/list/:storeId', controller.list);
router.put('/:id/permissions', controller.updatePermissions);
router.put('/:id/pin', controller.setPin);
router.delete('/:id', controller.removeEmployee);
router.get('/shift-summary/:storeId', controller.shiftSummary);

module.exports = router;
