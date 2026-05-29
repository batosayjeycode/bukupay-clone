const { redis } = require('../../config/redis');
const { generateOtp, maskPhone } = require('../../utils/helpers');
const logger = require('../../utils/logger');
const axios = require('axios');

const OTP_TTL = parseInt(process.env.OTP_TTL_SECONDS) || 300; // 5 menit
const MAX_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS) || 5;
const LOCKOUT_TTL = 15 * 60; // 15 menit

/**
 * Kirim OTP ke nomor telepon
 * Coba WhatsApp dulu, fallback ke SMS jika gagal
 */
async function sendOtp(phone) {
  // Cek apakah sedang terkunci
  const lockKey = `otp:lock:${phone}`;
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    throw new Error('TOO_MANY_ATTEMPTS');
  }

  const otp = generateOtp(6);
  const otpKey = `otp:${phone}`;
  const attemptsKey = `otp:attempts:${phone}`;

  // Simpan OTP ke Redis
  await redis.setex(otpKey, OTP_TTL, otp);
  await redis.setex(attemptsKey, OTP_TTL, '0');

  let channel = 'whatsapp';

  // Kirim OTP
  try {
    await sendViaWhatsApp(phone, otp);
    logger.info(`OTP sent via WhatsApp to ${maskPhone(phone)}`);
  } catch (waError) {
    logger.warn(`WhatsApp OTP failed for ${maskPhone(phone)}, trying SMS...`, waError.message);
    try {
      await sendViaSms(phone, otp);
      channel = 'sms';
      logger.info(`OTP sent via SMS to ${maskPhone(phone)}`);
    } catch (smsError) {
      logger.error(`SMS OTP also failed for ${maskPhone(phone)}:`, smsError.message);
      // Hapus OTP karena tidak berhasil dikirim
      await redis.del(otpKey, attemptsKey);
      throw new Error('OTP_SEND_FAILED');
    }
  }

  return { channel, expiresIn: OTP_TTL };
}

/**
 * Verifikasi OTP
 */
async function verifyOtp(phone, code) {
  const otpKey = `otp:${phone}`;
  const attemptsKey = `otp:attempts:${phone}`;
  const lockKey = `otp:lock:${phone}`;

  const [stored, attemptsStr] = await redis.mget(otpKey, attemptsKey);
  const attempts = parseInt(attemptsStr || '0');

  if (!stored) {
    throw new Error('OTP_EXPIRED');
  }

  if (attempts >= MAX_ATTEMPTS) {
    // Set lockout
    await redis.setex(lockKey, LOCKOUT_TTL, '1');
    await redis.del(otpKey, attemptsKey);
    throw new Error('TOO_MANY_ATTEMPTS');
  }

  if (stored !== code) {
    await redis.incr(attemptsKey);
    throw new Error('OTP_INVALID');
  }

  // OTP valid — hapus dari Redis
  await redis.del(otpKey, attemptsKey, lockKey);
  return true;
}

/**
 * Kirim OTP via WhatsApp Business API (Meta)
 */
async function sendViaWhatsApp(phone, otp) {
  if (!process.env.WA_API_KEY || !process.env.WA_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured');
  }

  await axios.post(
    `${process.env.WA_API_URL}${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'otp_verification',
        language: { code: 'id' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
}

/**
 * Kirim OTP via SMS (Twilio fallback)
 */
async function sendViaSms(phone, otp) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }

  const params = new URLSearchParams({
    To: phone,
    From: process.env.TWILIO_FROM,
    Body: `Kode OTP BukuPay Anda: ${otp}. Berlaku 5 menit. Jangan bagikan ke siapapun.`,
  });

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    params,
    {
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
      timeout: 10000,
    }
  );
}

module.exports = { sendOtp, verifyOtp };
