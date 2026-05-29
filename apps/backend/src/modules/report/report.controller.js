const reportService = require('./report.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

// GET /api/reports/daily?storeId=&date=2026-05-30
async function daily(req, res, next) {
  try {
    const { storeId, date } = req.query;
    const report = await reportService.getDailyReport(req.user.id, storeId || null, date);
    res.json(successResponse(report));
  } catch (err) {
    if (err.message === 'STORE_NOT_FOUND') return res.status(404).json(errorResponse('Toko tidak ditemukan'));
    next(err);
  }
}

// GET /api/reports/weekly?storeId=&weekStart=2026-05-26
async function weekly(req, res, next) {
  try {
    const { storeId, weekStart } = req.query;
    const report = await reportService.getWeeklyReport(req.user.id, storeId || null, weekStart);
    res.json(successResponse(report));
  } catch (err) {
    if (err.message === 'STORE_NOT_FOUND') return res.status(404).json(errorResponse('Toko tidak ditemukan'));
    next(err);
  }
}

// GET /api/reports/monthly?storeId=&month=2026-05
async function monthly(req, res, next) {
  try {
    const { storeId, month } = req.query;
    const report = await reportService.getMonthlyReport(req.user.id, storeId || null, month);
    res.json(successResponse(report));
  } catch (err) {
    if (err.message === 'STORE_NOT_FOUND') return res.status(404).json(errorResponse('Toko tidak ditemukan'));
    next(err);
  }
}

// GET /api/reports/top-hours?storeId=
async function topHours(req, res, next) {
  try {
    const { storeId } = req.query;
    const data = await reportService.getTopHours(req.user.id, storeId || null);
    res.json(successResponse(data));
  } catch (err) { next(err); }
}

// GET /api/reports/export?storeId=&startDate=2026-05-01&endDate=2026-05-31&format=csv
async function exportReport(req, res, next) {
  try {
    const { storeId, startDate, endDate, format = 'csv' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(errorResponse('startDate dan endDate wajib diisi'));
    }

    // Validasi date range maksimal 90 hari
    const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      return res.status(400).json(errorResponse('Maksimal rentang ekspor adalah 90 hari'));
    }

    if (format !== 'csv') {
      return res.status(400).json(errorResponse('Format hanya mendukung CSV'));
    }

    await reportService.exportCsv(res, req.user.id, storeId || null, startDate, endDate);
  } catch (err) {
    if (err.message === 'STORE_NOT_FOUND') return res.status(404).json(errorResponse('Toko tidak ditemukan'));
    next(err);
  }
}

module.exports = { daily, weekly, monthly, topHours, exportReport };
