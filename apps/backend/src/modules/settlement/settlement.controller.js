const settlementService = require('./settlement.service');

/**
 * GET /settlements/balance — saldo pending
 */
async function getBalance(req, res, next) {
  try {
    const result = await settlementService.getPendingBalance(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /settlements — riwayat pencairan
 */
async function getSettlements(req, res, next) {
  try {
    const { storeId, status, page, limit } = req.query;
    const result = await settlementService.getSettlements({
      userId: req.user.id,
      storeId,
      status,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBalance, getSettlements };
