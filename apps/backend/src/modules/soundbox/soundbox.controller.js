const soundboxService = require('./soundbox.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

/**
 * POST /api/soundbox/register
 * Body: { storeId, deviceId, name }
 */
async function registerDevice(req, res, next) {
  try {
    const { storeId, deviceId, name } = req.body;

    if (!storeId || !deviceId) {
      return res.status(400).json(errorResponse('storeId dan deviceId wajib diisi'));
    }

    const result = await soundboxService.registerDevice(req.user.id, storeId, deviceId, name);

    // credentials hanya dikembalikan sekali saat pairing
    res.status(201).json(successResponse(result, 'Soundbox berhasil dipasangkan'));
  } catch (err) {
    if (err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json(errorResponse('Toko tidak ditemukan'));
    }
    if (err.message === 'DEVICE_ALREADY_PAIRED') {
      return res.status(409).json(errorResponse('Perangkat sudah terhubung ke toko lain'));
    }
    next(err);
  }
}

/**
 * GET /api/soundbox/devices
 */
async function getDevices(req, res, next) {
  try {
    const devices = await soundboxService.getDevices(req.user.id);
    res.json(successResponse(devices));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/soundbox/devices/:id
 * Body: { name?, volume? }
 */
async function updateDevice(req, res, next) {
  try {
    const { name, volume } = req.body;
    const updated = await soundboxService.updateDevice(req.user.id, req.params.id, { name, volume });
    res.json(successResponse(updated, 'Soundbox berhasil diperbarui'));
  } catch (err) {
    if (err.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json(errorResponse('Perangkat tidak ditemukan'));
    }
    next(err);
  }
}

/**
 * DELETE /api/soundbox/devices/:id
 */
async function deleteDevice(req, res, next) {
  try {
    await soundboxService.deleteDevice(req.user.id, req.params.id);
    res.json(successResponse(null, 'Soundbox berhasil dihapus'));
  } catch (err) {
    if (err.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json(errorResponse('Perangkat tidak ditemukan'));
    }
    next(err);
  }
}

/**
 * POST /api/soundbox/test/:id
 */
async function sendTestSound(req, res, next) {
  try {
    const result = await soundboxService.sendTestSound(req.user.id, req.params.id);
    res.json(successResponse(result, 'Test suara dikirim'));
  } catch (err) {
    if (err.message === 'DEVICE_NOT_FOUND') {
      return res.status(404).json(errorResponse('Perangkat tidak ditemukan'));
    }
    if (err.message === 'DEVICE_OFFLINE') {
      return res.status(503).json(errorResponse('Perangkat sedang offline'));
    }
    if (err.message === 'MQTT_NOT_CONNECTED') {
      return res.status(503).json(errorResponse('Server MQTT tidak tersedia'));
    }
    next(err);
  }
}

module.exports = { registerDevice, getDevices, updateDevice, deleteDevice, sendTestSound };
