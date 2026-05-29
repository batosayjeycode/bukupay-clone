const adminService = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

// GET /api/admin/merchants?page=1&limit=20&search=&kycStatus=
async function listMerchants(req, res, next) {
  try {
    const { page, limit, search, kycStatus } = req.query;
    const result = await adminService.listMerchants({ page: +page || 1, limit: +limit || 20, search, kycStatus });
    res.json(successResponse(result));
  } catch (err) { next(err); }
}

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const stats = await adminService.getGlobalStats();
    res.json(successResponse(stats));
  } catch (err) { next(err); }
}

// GET /api/admin/merchants/:id
async function getMerchant(req, res, next) {
  try {
    const merchant = await adminService.getMerchantDetail(req.params.id);
    res.json(successResponse(merchant));
  } catch (err) {
    if (err.message === 'MERCHANT_NOT_FOUND') return res.status(404).json(errorResponse('Merchant tidak ditemukan'));
    next(err);
  }
}

// PATCH /api/admin/merchants/:id/status
async function toggleStatus(req, res, next) {
  try {
    const { isActive, reason } = req.body;
    const result = await adminService.toggleMerchantStatus(req.user.id, req.params.id, isActive, reason);
    res.json(successResponse(result, isActive ? 'Merchant diaktifkan' : 'Merchant disuspend'));
  } catch (err) {
    if (err.message === 'MERCHANT_NOT_FOUND') return res.status(404).json(errorResponse('Merchant tidak ditemukan'));
    next(err);
  }
}

// POST /api/admin/merchants/:id/kyc-review
async function reviewKyc(req, res, next) {
  try {
    const { status, note } = req.body;
    const result = await adminService.reviewKyc(req.user.id, req.params.id, status, note);
    res.json(successResponse(result, `KYC ${status.toLowerCase()}`));
  } catch (err) {
    if (err.message === 'MERCHANT_NOT_FOUND') return res.status(404).json(errorResponse('Merchant tidak ditemukan'));
    if (err.message === 'INVALID_STATUS') return res.status(400).json(errorResponse('Status harus VERIFIED atau REJECTED'));
    next(err);
  }
}

// GET /api/admin/logs
async function getLogs(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAdminLogs({ page: +page || 1, limit: +limit || 50 });
    res.json(successResponse(result));
  } catch (err) { next(err); }
}

module.exports = { listMerchants, getStats, getMerchant, toggleStatus, reviewKyc, getLogs };
