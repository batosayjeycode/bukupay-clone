const express = require('express');
const router = express.Router();
const { authenticate, requireKyc } = require('../../middlewares/auth.middleware');
const controller = require('./soundbox.controller');

// Semua routes butuh auth + KYC verified
router.use(authenticate, requireKyc);

// Device management
router.post('/register', controller.registerDevice);
router.get('/devices', controller.getDevices);
router.put('/devices/:id', controller.updateDevice);
router.delete('/devices/:id', controller.deleteDevice);
router.post('/test/:id', controller.sendTestSound);

module.exports = router;
