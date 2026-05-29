/**
 * Format angka ke format rupiah
 * @param {number} amount - jumlah dalam rupiah
 * @returns {string} formatted string, e.g. "Rp 50.000"
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalisasi nomor telepon ke format +62
 * @param {string} phone
 * @returns {string} normalized phone, e.g. "+6281234567890"
 */
function normalizePhone(phone) {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Replace leading 0 with 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }

  // Add + if missing
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Hitung MDR fee berdasarkan amount
 * @param {number} amount - dalam rupiah
 * @returns {number} fee dalam rupiah
 */
function calculateMdrFee(amount) {
  const MICRO_THRESHOLD = 500000; // Rp 500.000
  const MDR_STANDARD_RATE = 0.007; // 0.7%

  if (amount <= MICRO_THRESHOLD) {
    return 0; // 0% untuk transaksi <= 500.000
  }

  return Math.round(amount * MDR_STANDARD_RATE);
}

/**
 * Generate random OTP
 * @param {number} length - panjang OTP (default: 6)
 * @returns {string} OTP code
 */
function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Mask phone number untuk logging
 * @param {string} phone - e.g. "+6281234567890"
 * @returns {string} masked, e.g. "+62812****7890"
 */
function maskPhone(phone) {
  if (phone.length <= 8) return '****';
  return phone.slice(0, 5) + '****' + phone.slice(-4);
}

/**
 * Sanitize error message untuk response publik
 * @param {Error} error
 * @returns {string}
 */
function sanitizeError(error) {
  const publicMessages = {
    OTP_EXPIRED: 'Kode OTP sudah kedaluwarsa',
    OTP_INVALID: 'Kode OTP tidak valid',
    TOO_MANY_ATTEMPTS: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit',
    UNAUTHORIZED: 'Sesi Anda telah berakhir, silakan login ulang',
    FORBIDDEN: 'Anda tidak memiliki akses ke resource ini',
    KYC_NOT_VERIFIED: 'Harap selesaikan verifikasi identitas terlebih dahulu',
  };

  return publicMessages[error.message] || 'Terjadi kesalahan. Coba lagi';
}

module.exports = {
  formatRupiah,
  normalizePhone,
  calculateMdrFee,
  generateOtp,
  maskPhone,
  sanitizeError,
};
