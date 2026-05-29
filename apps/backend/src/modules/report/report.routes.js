const express = require('express');
const router = express.Router();
const { authenticate, requireKyc } = require('../../middlewares/auth.middleware');
const controller = require('./report.controller');

router.use(authenticate, requireKyc);

router.get('/daily', controller.daily);
router.get('/weekly', controller.weekly);
router.get('/monthly', controller.monthly);
router.get('/top-hours', controller.topHours);
router.get('/export', controller.exportReport);

module.exports = router;
