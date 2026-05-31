'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../lib/store';
import api from '../../../lib/api';

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prof, bank] = await Promise.all([
          api.get('/merchant/profile'),
          api.get('/merchant/bank-accounts'),
        ]);
        const p = prof.data;
        setProfile(p);
        setFullName(p?.fullName || '');
        setEmail(p?.email || '');
        setBankAccounts(bank.data || []);
      } catch { /* profile might not exist yet */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaved(false);
    try {
      const res = await api.put('/merchant/profile', { fullName, email });
      setAuth({ ...user, fullName, email }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', color: '#9CA3AF' }}>Memuat...</div>;
  }

  const kycStatusMap = {
    VERIFIED:  { label: '✅ Terverifikasi', color: '#10B981' },
    SUBMITTED: { label: '⏳ Menunggu Review', color: '#F59E0B' },
    REJECTED:  { label: '❌ Ditolak', color: '#EF4444' },
    PENDING:   { label: '📋 Belum KYC', color: '#6B7280' },
  };
  const kycInfo = kycStatusMap[user?.kycStatus] || kycStatusMap.PENDING;

  return (
    <div style={{ padding: '32px', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF', marginBottom: '24px' }}>⚙️ Pengaturan</h1>

      {/* Profile */}
      <section style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFF', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>👤 Profil Akun</h2>
        <form onSubmit={handleSaveProfile}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nomor HP</label>
            <input
              value={user?.phone || ''}
              disabled
              style={{ width: '100%', background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px 14px', color: '#6B7280', fontSize: '14px', cursor: 'not-allowed' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nama Lengkap</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama sesuai KTP"
              style={{ width: '100%', background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Email (opsional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              style={{ width: '100%', background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="submit" disabled={saveLoading} style={{ background: '#6C63FF', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#FFF', fontWeight: '700', cursor: 'pointer', opacity: saveLoading ? 0.7 : 1 }}>
              {saveLoading ? 'Menyimpan...' : '💾 Simpan Profil'}
            </button>
            {saved && <span style={{ color: '#10B981', fontSize: '13px' }}>✅ Tersimpan!</span>}
          </div>
        </form>
      </section>

      {/* KYC Status */}
      <section style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFF', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>🪪 Status KYC</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: kycInfo.color, fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{kycInfo.label}</p>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>
              {user?.kycStatus === 'VERIFIED'
                ? 'Identitas Anda sudah terverifikasi. Semua fitur tersedia.'
                : user?.kycStatus === 'SUBMITTED'
                ? 'Dokumen sedang diverifikasi oleh tim kami. Estimasi 1x24 jam.'
                : user?.kycStatus === 'REJECTED'
                ? 'Verifikasi ditolak. Buka aplikasi mobile untuk mengulang KYC.'
                : 'Lengkapi KYC via aplikasi mobile untuk mengaktifkan fitur pembayaran.'}
            </p>
          </div>
        </div>
      </section>

      {/* Bank Accounts */}
      <section style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFF', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>🏦 Rekening Bank</h2>
        {bankAccounts.length === 0 ? (
          <div style={{ padding: '20px', background: '#0A0A1A', borderRadius: '10px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>
              Belum ada rekening bank terdaftar. Tambah via aplikasi mobile.
            </p>
          </div>
        ) : bankAccounts.map((acc) => (
          <div key={acc.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#0A0A1A', borderRadius: '12px', padding: '14px 16px',
            marginBottom: '8px', border: acc.isPrimary ? '1px solid #6C63FF40' : '1px solid #1E1E3F',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#FFF', fontWeight: '700', fontSize: '14px' }}>{acc.bankCode}</p>
                {acc.isPrimary && (
                  <span style={{ background: '#6C63FF20', color: '#6C63FF', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>UTAMA</span>
                )}
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>{acc.accountNumber}</p>
              <p style={{ color: '#6B7280', fontSize: '12px' }}>{acc.accountHolder}</p>
            </div>
            <span style={{ fontSize: '28px' }}>🏦</span>
          </div>
        ))}
        <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '12px' }}>
          💡 Tambah atau ubah rekening via aplikasi mobile BukuPay
        </p>
      </section>

      {/* App Version */}
      <section style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ color: '#FFF', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>ℹ️ Informasi</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            { label: 'Versi Dashboard', value: 'v2.0.0 (Phase 2)' },
            { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL || 'https://api.bukupay.id' },
            { label: 'Role', value: user?.role || '—' },
            { label: 'ID Pengguna', value: `...${user?.id?.slice(-12) || '—'}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E1E3F' }}>
              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{label}</span>
              <span style={{ color: '#FFF', fontSize: '13px', fontFamily: 'monospace' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
