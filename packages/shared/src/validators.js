/**
 * @bukupay/shared — Validators
 * Validasi yang konsisten antara backend dan frontend
 */

const PHONE_REGEX = /^(\+62|62|0)[0-9]{9,13}$/;
const NIK_REGEX = /^[0-9]{16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BANK_ACCOUNT_REGEX = /^[0-9]{6,20}$/;

/**
 * Validasi nomor telepon Indonesia
 * @param {string} phone
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePhone(phone) {
  if (!phone) return { valid: false, message: 'Nomor telepon wajib diisi' };
  if (!PHONE_REGEX.test(phone.trim())) {
    return { valid: false, message: 'Format nomor telepon tidak valid. Gunakan: 08xxx atau +628xxx' };
  }
  return { valid: true };
}

/**
 * Validasi NIK (16 digit)
 * @param {string} nik
 * @returns {{ valid: boolean, message?: string }}
 */
function validateNik(nik) {
  if (!nik) return { valid: false, message: 'NIK wajib diisi' };
  if (!NIK_REGEX.test(nik)) {
    return { valid: false, message: 'NIK harus 16 digit angka' };
  }
  return { valid: true };
}

/**
 * Validasi nomor rekening bank
 * @param {string} accountNo
 * @returns {{ valid: boolean, message?: string }}
 */
function validateBankAccount(accountNo) {
  if (!accountNo) return { valid: false, message: 'Nomor rekening wajib diisi' };
  if (!BANK_ACCOUNT_REGEX.test(accountNo)) {
    return { valid: false, message: 'Nomor rekening tidak valid (6-20 digit)' };
  }
  return { valid: true };
}

/**
 * Validasi email
 * @param {string} email
 * @returns {{ valid: boolean, message?: string }}
 */
function validateEmail(email) {
  if (!email) return { valid: true }; // Email opsional
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Format email tidak valid' };
  }
  return { valid: true };
}

/**
 * Validasi jumlah transaksi
 * @param {number} amount - dalam rupiah
 * @returns {{ valid: boolean, message?: string }}
 */
function validateAmount(amount) {
  if (!amount || isNaN(amount)) {
    return { valid: false, message: 'Jumlah tidak valid' };
  }
  if (amount < 1000) {
    return { valid: false, message: 'Jumlah minimum adalah Rp 1.000' };
  }
  if (amount > 500000000) {
    return { valid: false, message: 'Jumlah maksimum adalah Rp 500.000.000' };
  }
  return { valid: true };
}

module.exports = {
  validatePhone,
  validateNik,
  validateBankAccount,
  validateEmail,
  validateAmount,
  PHONE_REGEX,
  NIK_REGEX,
  EMAIL_REGEX,
  BANK_ACCOUNT_REGEX,
};
