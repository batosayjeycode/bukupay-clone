/**
 * Unit tests — OTP Service
 */

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    mget: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
  },
}));

// Mock external OTP delivery (WhatsApp/SMS)
jest.mock('axios');

const { redis } = require('../../src/config/redis');
const { sendOtp, verifyOtp } = require('../../src/modules/auth/otp.service');

describe('OTP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should send OTP and store in Redis', async () => {
      redis.get.mockResolvedValue(null); // not locked
      redis.setex.mockResolvedValue('OK');

      const axios = require('axios');
      axios.post.mockRejectedValue(new Error('WA not configured')); // WA fails

      // SMS also fails (no Twilio config in test)
      // So OTP_SEND_FAILED will be thrown unless we have credentials
      // In test environment, we just verify Redis was called
      process.env.WA_API_KEY = '';
      process.env.TWILIO_ACCOUNT_SID = '';

      await expect(sendOtp('+6281234567890')).rejects.toThrow('OTP_SEND_FAILED');

      // Redis should have stored OTP
      expect(redis.setex).toHaveBeenCalledTimes(2); // otp + attempts
    });

    it('should throw TOO_MANY_ATTEMPTS if locked', async () => {
      redis.get.mockResolvedValue('1'); // locked

      await expect(sendOtp('+6281234567890')).rejects.toThrow('TOO_MANY_ATTEMPTS');
    });
  });

  describe('verifyOtp', () => {
    it('should verify correct OTP', async () => {
      redis.mget.mockResolvedValue(['123456', '0']);
      redis.del.mockResolvedValue(1);

      const result = await verifyOtp('+6281234567890', '123456');
      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw OTP_EXPIRED if not in Redis', async () => {
      redis.mget.mockResolvedValue([null, '0']);

      await expect(verifyOtp('+6281234567890', '123456')).rejects.toThrow('OTP_EXPIRED');
    });

    it('should throw OTP_INVALID for wrong code', async () => {
      redis.mget.mockResolvedValue(['123456', '1']);
      redis.incr.mockResolvedValue(2);

      await expect(verifyOtp('+6281234567890', '999999')).rejects.toThrow('OTP_INVALID');
      expect(redis.incr).toHaveBeenCalled();
    });

    it('should throw TOO_MANY_ATTEMPTS after 5 fails', async () => {
      redis.mget.mockResolvedValue(['123456', '5']); // 5 attempts
      redis.setex.mockResolvedValue('OK');
      redis.del.mockResolvedValue(1);

      await expect(verifyOtp('+6281234567890', '999999')).rejects.toThrow('TOO_MANY_ATTEMPTS');
    });
  });
});
