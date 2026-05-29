'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api';

const KYC_BADGE = {
  VERIFIED: { label: 'Terverifikasi', color: '#10B981', bg: '#10B98120' },
  SUBMITTED: { label: 'Menunggu', color: '#F59E0B', bg: '#F59E0B20' },
  PENDING: { label: 'Belum Dikirim', color: '#6B7280', bg: '#6B728020' },
  REJECTED: { label: 'Ditolak', color: '#EF4444', bg: '#EF444420' },
};

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [kycModal, setKycModal] = useState(null); // { merchantId, phone }
  const [kycNote, setKycNote] = useState('');
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMerchants({ page, limit: LIMIT, search, kycStatus: kycFilter });
      setMerchants(res.data?.merchants || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, kycFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleToggleStatus = async (merchant) => {
    const reason = prompt(`${merchant.isActive ? 'Alasan suspend' : 'Alasan aktifkan kembali'} merchant ${merchant.phone}:`);
    if (reason === null) return; // user cancelled
    try {
      await adminApi.toggleStatus(merchant.id, !merchant.isActive, reason);
      load();
    } catch (err) { alert('Gagal mengubah status'); }
  };

  const handleKycReview = async (status) => {
    try {
      await adminApi.reviewKyc(kycModal.merchantId, status, kycNote);
      setKycModal(null);
      setKycNote('');
      load();
    } catch (err) { alert('Gagal update KYC'); }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>🏪 Merchant</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Total {total} merchant terdaftar</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor HP atau nama..."
            style={{
              flex: 1, background: '#12122A', border: '1px solid #1E1E3F',
              borderRadius: '10px', padding: '10px 14px',
              color: '#FFF', fontSize: '14px', outline: 'none',
            }}
          />
          <button type="submit" style={{
            background: '#6C63FF', border: 'none', borderRadius: '10px',
            padding: '10px 16px', color: '#FFF', fontWeight: '700', cursor: 'pointer',
          }}>Cari</button>
        </form>
        <select
          value={kycFilter}
          onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
          style={{
            background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '10px',
            padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none',
          }}
        >
          <option value="">Semua KYC</option>
          <option value="SUBMITTED">Menunggu Review</option>
          <option value="VERIFIED">Terverifikasi</option>
          <option value="REJECTED">Ditolak</option>
          <option value="PENDING">Belum KYC</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #1E1E3F' }}>
          {['Merchant', 'Toko', 'KYC Status', 'Akun', 'Aksi'].map((h) => (
            <span key={h} style={{ color: '#6B7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Memuat...</div>
        ) : merchants.map((m) => {
          const badge = KYC_BADGE[m.kycStatus] || KYC_BADGE.PENDING;
          return (
            <div key={m.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '14px 20px', borderBottom: '1px solid #1E1E3F',
              background: !m.isActive ? '#EF444408' : 'transparent',
            }}>
              <div>
                <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>{m.fullName || '—'}</p>
                <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{m.phone}</p>
              </div>
              <span style={{ color: '#9CA3AF', fontSize: '13px', alignSelf: 'center' }}>{m._count?.stores} toko</span>
              <span style={{ alignSelf: 'center' }}>
                <span style={{
                  background: badge.bg, color: badge.color,
                  borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: '700',
                }}>{badge.label}</span>
              </span>
              <span style={{
                alignSelf: 'center', color: m.isActive ? '#10B981' : '#EF4444',
                fontSize: '12px', fontWeight: '700',
              }}>{m.isActive ? 'Aktif' : 'Suspend'}</span>
              <div style={{ display: 'flex', gap: '6px', alignSelf: 'center', flexWrap: 'wrap' }}>
                {m.kycStatus === 'SUBMITTED' && (
                  <button onClick={() => setKycModal({ merchantId: m.id, phone: m.phone })} style={{
                    background: '#F59E0B20', border: '1px solid #F59E0B', borderRadius: '6px',
                    padding: '4px 8px', color: '#F59E0B', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                  }}>Review KYC</button>
                )}
                <button onClick={() => handleToggleStatus(m)} style={{
                  background: m.isActive ? '#EF444420' : '#10B98120',
                  border: `1px solid ${m.isActive ? '#EF4444' : '#10B981'}`,
                  borderRadius: '6px', padding: '4px 8px',
                  color: m.isActive ? '#EF4444' : '#10B981',
                  cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                }}>{m.isActive ? 'Suspend' : 'Aktifkan'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* KYC Review Modal */}
      {kycModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000000CC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '20px', padding: '28px', width: '420px' }}>
            <h2 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Review KYC</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>Merchant: {kycModal.phone}</p>
            <textarea
              value={kycNote}
              onChange={(e) => setKycNote(e.target.value)}
              placeholder="Catatan (wajib jika menolak)..."
              rows={3}
              style={{
                width: '100%', background: '#0A0A1A',
                border: '1px solid #1E1E3F', borderRadius: '10px',
                padding: '12px', color: '#FFF', fontSize: '14px',
                resize: 'none', outline: 'none', marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleKycReview('VERIFIED')} style={{
                flex: 1, background: '#10B98120', border: '1px solid #10B981',
                borderRadius: '10px', padding: '12px', color: '#10B981',
                fontWeight: '700', cursor: 'pointer',
              }}>✅ Setujui</button>
              <button onClick={() => handleKycReview('REJECTED')} disabled={!kycNote} style={{
                flex: 1, background: kycNote ? '#EF444420' : '#1A1A35',
                border: `1px solid ${kycNote ? '#EF4444' : '#1E1E3F'}`,
                borderRadius: '10px', padding: '12px',
                color: kycNote ? '#EF4444' : '#6B7280',
                fontWeight: '700', cursor: kycNote ? 'pointer' : 'not-allowed',
              }}>❌ Tolak</button>
              <button onClick={() => setKycModal(null)} style={{
                background: '#1A1A35', border: '1px solid #1E1E3F',
                borderRadius: '10px', padding: '12px', color: '#9CA3AF',
                cursor: 'pointer',
              }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
