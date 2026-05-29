const prisma = require('../../config/database');
const { publishConfig, publishTestSound } = require('../../config/mqtt');
const { generateOtp } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

/**
 * Generate MQTT credentials unik untuk satu device
 * @param {string} deviceId - MAC address
 * @returns {{ username: string, password: string }}
 */
async function generateMqttCredentials(deviceId) {
  // username = "device_{deviceId_safe}"
  const username = `device_${deviceId.replace(/:/g, '').toLowerCase()}`;
  // password = random 32 char
  const password = require('crypto').randomBytes(16).toString('hex');
  const passHash = await bcrypt.hash(password, 10);

  return { username, password, passHash };
}

/**
 * Daftarkan soundbox baru (pairing via QR)
 * @param {string} userId - owner/employee yang melakukan pairing
 * @param {string} storeId
 * @param {string} deviceId - MAC address dari QR code
 * @param {string} name - nama device
 */
async function registerDevice(userId, storeId, deviceId, name) {
  // Verifikasi store milik user
  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: userId },
  });
  if (!store) throw new Error('STORE_NOT_FOUND');

  // Cek apakah device sudah terdaftar di store lain
  const existing = await prisma.soundboxDevice.findUnique({ where: { deviceId } });
  if (existing && existing.storeId !== storeId) {
    throw new Error('DEVICE_ALREADY_PAIRED');
  }

  const { username, password, passHash } = await generateMqttCredentials(deviceId);

  const device = await prisma.soundboxDevice.upsert({
    where: { deviceId },
    create: {
      storeId,
      deviceId,
      name: name || `Soundbox ${deviceId.slice(-5)}`,
      mqttUsername: username,
      mqttPassHash: passHash,
    },
    update: {
      storeId,
      name: name || `Soundbox ${deviceId.slice(-5)}`,
      mqttUsername: username,
      mqttPassHash: passHash,
    },
  });

  logger.info('[Soundbox] Device registered:', deviceId, 'store:', storeId);

  // Kembalikan credentials plaintext — hanya sekali ini!
  return {
    device,
    mqttCredentials: {
      username,
      password,
      brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
      topic: `bukupay/device/${deviceId}/#`,
    },
  };
}

/**
 * List semua soundbox milik merchant (semua toko)
 * @param {string} userId
 */
async function getDevices(userId) {
  const stores = await prisma.store.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const storeIds = stores.map((s) => s.id);

  return prisma.soundboxDevice.findMany({
    where: { storeId: { in: storeIds } },
    include: { store: { select: { name: true, id: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update nama/volume soundbox
 * @param {string} userId
 * @param {string} deviceDbId - ID di database (bukan MAC)
 * @param {{ name?, volume? }} data
 */
async function updateDevice(userId, deviceDbId, data) {
  // Pastikan device milik user
  const device = await prisma.soundboxDevice.findFirst({
    where: { id: deviceDbId },
    include: { store: { select: { ownerId: true } } },
  });

  if (!device || device.store.ownerId !== userId) {
    throw new Error('DEVICE_NOT_FOUND');
  }

  const updated = await prisma.soundboxDevice.update({
    where: { id: deviceDbId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.volume !== undefined && { volume: Math.max(0, Math.min(100, data.volume)) }),
    },
  });

  // Kirim config update via MQTT
  publishConfig(device.deviceId, {
    ...(data.volume !== undefined && { volume: updated.volume }),
    ...(data.name && { name: updated.name }),
  });

  return updated;
}

/**
 * Hapus soundbox dari toko
 * @param {string} userId
 * @param {string} deviceDbId
 */
async function deleteDevice(userId, deviceDbId) {
  const device = await prisma.soundboxDevice.findFirst({
    where: { id: deviceDbId },
    include: { store: { select: { ownerId: true } } },
  });

  if (!device || device.store.ownerId !== userId) {
    throw new Error('DEVICE_NOT_FOUND');
  }

  await prisma.soundboxDevice.delete({ where: { id: deviceDbId } });
  logger.info('[Soundbox] Device deleted:', deviceDbId);
}

/**
 * Kirim test sound ke soundbox
 * @param {string} userId
 * @param {string} deviceDbId
 */
async function sendTestSound(userId, deviceDbId) {
  const device = await prisma.soundboxDevice.findFirst({
    where: { id: deviceDbId },
    include: { store: { select: { ownerId: true } } },
  });

  if (!device || device.store.ownerId !== userId) {
    throw new Error('DEVICE_NOT_FOUND');
  }

  if (!device.isOnline) {
    throw new Error('DEVICE_OFFLINE');
  }

  const success = publishTestSound(device.deviceId);
  if (!success) throw new Error('MQTT_NOT_CONNECTED');

  return { sent: true, deviceId: device.deviceId };
}

/**
 * Verifikasi MQTT credentials device (dipanggil oleh Mosquitto auth plugin)
 * @param {string} username - mqttUsername device
 * @param {string} password - plaintext
 */
async function verifyMqttCredentials(username, password) {
  const device = await prisma.soundboxDevice.findFirst({
    where: { mqttUsername: username },
  });

  if (!device || !device.mqttPassHash) return false;
  return bcrypt.compare(password, device.mqttPassHash);
}

module.exports = {
  registerDevice,
  getDevices,
  updateDevice,
  deleteDevice,
  sendTestSound,
  verifyMqttCredentials,
};
