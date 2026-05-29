const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const controller = require('./admin.controller');

// Middleware: hanya ADMIN role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Akses ditolak — admin only' });
  }
  next();
}

router.use(authenticate, requireAdmin);

router.get('/stats', controller.getStats);
router.get('/merchants', controller.listMerchants);
router.get('/merchants/:id', controller.getMerchant);
router.patch('/merchants/:id/status', controller.toggleStatus);
router.post('/merchants/:id/kyc-review', controller.reviewKyc);
router.get('/logs', controller.getLogs);

module.exports = router;
