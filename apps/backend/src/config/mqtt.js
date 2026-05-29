const mqtt = require('mqtt');
const logger = require('../utils/logger');

let mqttClient = null;

/**
 * Inisialisasi koneksi MQTT ke Mosquitto / AWS IoT Core
 * Dipanggil dari server.js saat startup
 */
function initMqtt() {
  const brokerUrl = process.env.MQTT_BROKER_URL;

  if (!brokerUrl) {
    logger.warn('[MQTT] MQTT_BROKER_URL tidak dikonfigurasi — MQTT disabled');
    return null;
  }

  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `bukupay-backend-${process.pid}-${Date.now()}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    keepalive: 60,
    // TLS (untuk production)
    ...(process.env.MQTT_TLS === 'true' && {
      protocol: 'mqtts',
      rejectUnauthorized: true,
    }),
  };

  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    logger.info('[MQTT] Connected to broker:', brokerUrl);

    // Subscribe ke status heartbeat dari semua devices
    mqttClient.subscribe('bukupay/device/+/status', { qos: 0 }, (err) => {
      if (err) logger.error('[MQTT] Subscribe error:', err);
    });
  });

  mqttClient.on('message', handleStatusMessage);

  mqttClient.on('error', (err) => {
    logger.error('[MQTT] Connection error:', err.message);
  });

  mqttClient.on('offline', () => {
    logger.warn('[MQTT] Client offline — attempting reconnect...');
  });

  return mqttClient;
}

/**
 * Handle heartbeat dari soundbox device
 * Topic: bukupay/device/{deviceId}/status
 * Payload: { status: "online", firmwareVer: "1.0.2", volume: 80 }
 */
async function handleStatusMessage(topic, buffer) {
  try {
    const deviceId = topic.split('/')[2];
    const payload = JSON.parse(buffer.toString());

    const prisma = require('./database');
    await prisma.soundboxDevice.updateMany({
      where: { deviceId },
      data: {
        isOnline: payload.status === 'online',
        lastSeenAt: new Date(),
        ...(payload.firmwareVer && { firmwareVer: payload.firmwareVer }),
        ...(payload.volume !== undefined && { volume: payload.volume }),
      },
    });
  } catch {
    // Jangan crash server karena error heartbeat
  }
}

/**
 * Publish notifikasi pembayaran ke soundbox
 * @param {string} deviceId - MAC address perangkat
 * @param {Object} payload - { amount, storeName, timestamp }
 * @returns {boolean} berhasil atau tidak
 */
function publishPayment(deviceId, payload) {
  if (!mqttClient || !mqttClient.connected) {
    logger.warn('[MQTT] Client not connected — skip publish for device:', deviceId);
    return false;
  }

  const topic = `bukupay/device/${deviceId}/payment`;
  const message = JSON.stringify({
    amount: payload.amount,
    storeName: payload.storeName,
    timestamp: payload.timestamp || Date.now(),
    currency: 'IDR',
  });

  mqttClient.publish(topic, message, { qos: 1, retain: false }, (err) => {
    if (err) {
      logger.error('[MQTT] Publish error to', topic, ':', err.message);
    } else {
      logger.debug('[MQTT] Payment published to device:', deviceId, 'amount:', payload.amount);
    }
  });

  return true;
}

/**
 * Publish konfigurasi ke soundbox (update volume, dll)
 * @param {string} deviceId
 * @param {Object} config - { volume?, name? }
 */
function publishConfig(deviceId, config) {
  if (!mqttClient?.connected) return false;

  const topic = `bukupay/device/${deviceId}/config`;
  mqttClient.publish(topic, JSON.stringify(config), { qos: 1 });
  return true;
}

/**
 * Publish test sound ke soundbox
 * @param {string} deviceId
 */
function publishTestSound(deviceId) {
  if (!mqttClient?.connected) return false;

  const topic = `bukupay/device/${deviceId}/payment`;
  const testPayload = JSON.stringify({
    amount: 10000,
    storeName: 'Test',
    timestamp: Date.now(),
    isTest: true,
  });

  mqttClient.publish(topic, testPayload, { qos: 1 });
  return true;
}

function getMqttClient() {
  return mqttClient;
}

function isConnected() {
  return mqttClient?.connected === true;
}

module.exports = {
  initMqtt,
  publishPayment,
  publishConfig,
  publishTestSound,
  getMqttClient,
  isConnected,
};
