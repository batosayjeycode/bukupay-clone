const transactionService = require('./transaction.service');

/**
 * GET /transactions
 */
async function getTransactions(req, res, next) {
  try {
    const { storeId, status, startDate, endDate, page, limit } = req.query;

    const result = await transactionService.getTransactions({
      userId: req.user.id,
      storeId,
      status,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /transactions/:id
 */
async function getTransactionById(req, res, next) {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.id,
      req.user.id
    );

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTransactions, getTransactionById };
