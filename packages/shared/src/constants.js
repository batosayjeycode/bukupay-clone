/**
 * @bukupay/shared — Constants
 * Digunakan oleh backend dan mobile app
 */

module.exports = {
  // OTP
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 300,         // 5 menit
  MAX_OTP_ATTEMPTS: 5,
  OTP_LOCKOUT_SECONDS: 900,     // 15 menit

  // MDR (Merchant Discount Rate)
  MICRO_THRESHOLD: 500000,      // Rp 500.000
  MDR_MICRO_RATE: 0,            // 0% untuk <= 500.000
  MDR_STANDARD_RATE: 0.007,     // 0.7% untuk > 500.000

  // Settlement
  SETTLEMENT_SCHEDULE_HOURS: [10, 15, 20],  // WIB
  MIN_SETTLEMENT_AMOUNT: 10000,             // Rp 10.000

  // Subscription
  FREE_TRIAL_DAYS: 60,
  DAILY_SUBSCRIPTION_FEE: 1500,            // Rp 1.500/hari
  MIN_ACTIVE_TRANSACTION: 20000,           // Rp 20.000

  // File Upload
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,   // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Transaction Status
  TX_STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },

  // KYC Status
  KYC_STATUS: {
    PENDING: 'PENDING',
    SUBMITTED: 'SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
  },

  // Settlement Status
  SETTLE_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },

  // Indonesian Bank Codes (top banks)
  BANK_CODES: {
    BCA: 'BCA',
    MANDIRI: 'MANDIRI',
    BRI: 'BRI',
    BNI: 'BNI',
    CIMB: 'CIMB',
    BSI: 'BSI',
    DANAMON: 'DANAMON',
    PERMATA: 'PERMATA',
    JENIUS: 'JENIUS',
    OVO: 'OVO',
    GOPAY: 'GOPAY',
    DANA: 'DANA',
  },
};
