'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      await authApi.requestOtp(phone);
      setStep('otp');
      startCountdown();
    } catch (err) {
      setError(err.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp(phone, otp);
      const { user, accessToken } = result.data;
      setAuth(user, accessToken);

      // Redirect berdasarkan role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'OTP salah atau kadaluwarsa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A1A' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: '#1E1E3F', border: '1px solid #6C63FF40',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 16px',
          }}>💳</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFF', marginBottom: '8px' }}>
            BukuPay Dashboard
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {step === 'phone' ? 'Masukkan nomor HP untuk melanjutkan' : `Kode OTP dikirim ke ${phone}`}
          </p>
        </div>

        {/* Form */}
        <div className="card" style={{ borderRadius: '20px' }}>
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>
                Nomor HP
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: '#0A0A1A', borderRadius: '12px',
                border: '1px solid #1E1E3F', padding: '12px 16px',
                marginBottom: '20px',
              }}>
                <span style={{ color: '#9CA3AF', marginRight: '8px' }}>🇮🇩 +62</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="81234567890"
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: '#FFF', fontSize: '15px', flex: 1,
                  }}
                  required
                />
              </div>

              {error && (
                <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {error}
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                {loading ? 'Mengirim...' : 'Kirim Kode OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>
                Kode OTP (6 digit)
              </label>
              <input
                type="number"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%', background: '#0A0A1A',
                  border: '1px solid #1E1E3F', borderRadius: '12px',
                  padding: '14px 16px', color: '#FFF',
                  fontSize: '24px', textAlign: 'center',
                  letterSpacing: '8px', outline: 'none',
                  marginBottom: '20px',
                }}
                required
              />

              {error && (
                <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {error}
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={loading || otp.length < 6} style={{ width: '100%', padding: '14px' }}>
                {loading ? 'Memverifikasi...' : 'Verifikasi ✓'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                {countdown > 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px' }}>
                    Kirim ulang dalam <span style={{ color: '#6C63FF', fontWeight: '700' }}>{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    style={{ background: 'none', border: 'none', color: '#6C63FF', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Kirim ulang OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                style={{
                  display: 'block', width: '100%', marginTop: '12px',
                  background: 'none', border: 'none', color: '#6B7280',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                ← Ganti nomor HP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
