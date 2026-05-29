const express = require('express');
const router = express.Router();
const notificationService = require('./notification.service');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);

// POST /notification/register-token — simpan FCM token device
router.post('/register-token', async (req, res, next) => {
  try {
    const { token, device } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_REQUIRED',
        message: 'FCM token wajib diisi',
      });
    }

    await notificationService.registerToken(req.user.id, token, device);

    res.json({
      success: true,
      message: 'FCM token berhasil didaftarkan',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
