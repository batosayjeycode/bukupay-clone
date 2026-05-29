const qrisService = require('./qris.service');

/**
 * POST /qris/generate
 */
async function generateQris(req, res, next) {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'STORE_ID_REQUIRED',
        message: 'storeId wajib diisi',
      });
    }

    const result = await qrisService.generateOrGetQris(storeId, req.user.id);

    res.json({
      success: true,
      message: 'QRIS berhasil di-generate',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /qris/:storeId
 */
async function getQris(req, res, next) {
  try {
    const { storeId } = req.params;
    const result = await qrisService.getQrisForStore(storeId);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateQris, getQris };
