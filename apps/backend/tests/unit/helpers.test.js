/**
 * Unit tests — Helpers
 */

const {
  formatRupiah,
  normalizePhone,
  calculateMdrFee,
  generateOtp,
  maskPhone,
} = require('../../src/utils/helpers');

describe('Helpers', () => {
  describe('normalizePhone', () => {
    it('should convert 08xxx to +628xxx', () => {
      expect(normalizePhone('081234567890')).toBe('+6281234567890');
    });

    it('should handle 628xxx format', () => {
      expect(normalizePhone('6281234567890')).toBe('+6281234567890');
    });

    it('should not modify +628xxx format', () => {
      expect(normalizePhone('+6281234567890')).toBe('+6281234567890');
    });
  });

  describe('calculateMdrFee', () => {
    it('should return 0 for amounts <= 500000', () => {
      expect(calculateMdrFee(100000)).toBe(0);
      expect(calculateMdrFee(500000)).toBe(0);
    });

    it('should return 0.7% for amounts > 500000', () => {
      expect(calculateMdrFee(1000000)).toBe(7000);
      expect(calculateMdrFee(2000000)).toBe(14000);
    });
  });

  describe('generateOtp', () => {
    it('should generate 6-digit OTP by default', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(/^[0-9]+$/.test(otp)).toBe(true);
    });

    it('should generate OTP of specified length', () => {
      const otp = generateOtp(4);
      expect(otp).toHaveLength(4);
    });
  });

  describe('maskPhone', () => {
    it('should mask middle digits', () => {
      const masked = maskPhone('+6281234567890');
      expect(masked).toContain('****');
      expect(masked.startsWith('+6281')).toBe(true);
      expect(masked.endsWith('7890')).toBe(true);
    });
  });

  describe('formatRupiah', () => {
    it('should format number to Rupiah', () => {
      const formatted = formatRupiah(50000);
      expect(formatted).toContain('50');
      expect(formatted.toLowerCase()).toContain('idr');
    });
  });
});
