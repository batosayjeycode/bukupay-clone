'use client';

import { useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '../../../lib/api';
import { useDashboardStore } from '../../../lib/store';

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
}

const STATUS = {
  COMPLETED: { label: 'Selesai', color: '#10B981', bg: '#10B98120' },
  PENDING:   { label: 'Menunggu', color: '#F59E0B', bg: '#F59E0B20' },
  PROCESSING:{ label: 'Diproses', color: '#6C63FF', bg: '#6C63FF20' },
  FAILED:    { label: 'Gagal', color: '#EF4444', bg: '#EF444420' },
};

const INSTANT_FEE = 2500;
const INSTANT_MIN = 50000;

export default function SettlementsPage() {
  const { activeStore } = useDashboardStore();
  const [balance, setBalance] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instantModal, setInstantModal] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [instantMsg, setInstantMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        dashboardApi.getBalance(),
        dashboardApi.getSettlements({ storeId: activeStore?.id, limit: 30 }),
      ]);
      setBalance(bal.data);
      setSettlements(hist.data?.settlements || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeStore]);

  useEffect(() => { load(); }, [load]);

  const handleInstant = async () => {
    setInstantLoading(true);
    setInstantMsg('');
    try {
      await dashboardApi.requestInstant(balance.availableBalance);
      setInstantModal(false);
      setInstantMsg('success');
      await load();
    } catch (err) {
      setInstantMsg(err.message || 'Gagal memproses pencairan');
    } finally {
      setInstantLoading(false);
    }
  };

  const canInstant = balance && balance.availableBalance >= INSTANT_MIN;

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>💰 Pencairan Dana</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Saldo & riwayat pencairan ke rekening bank</p>
      </div>

      {/* Balance Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, #6C63FF20, #1A1A35)',
        border: '1px solid #6C63FF40', borderRadius: '20px', padding: '28px',
        marginBottom: '24px',
      }}>
        <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>Saldo Tersedia</p>
        <p style={{ color: '#FFF', fontSize: '40px', fontWeight: '900', marginBottom: '20px' }}>
          {loading ? '—' : formatRupiah(balance?.availableBalance || 0)}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Total Pemasukan', value: balance?.totalEarned, icon: '📈' },
            { label: 'Total Dicairkan', value: balance?.totalSettled, icon: '🏦' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#0A0A1A40', borderRadius: '12px', padding: '14px' }}>
              <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>
                {item.icon} {item.label}
              </p>
              <p style={{ color: '#FFF', fontSize: '18px', fontWeight: '700' }}>
                {loading ? '—' : formatRupiah(item.value || 0)}
              </p>
            </div>
          ))}
        </div>

        {/* Instant button */}
        {canInstant ? (
          <button
            onClick={() => setInstantModal(true)}
            style={{
              background: '#6C63FF', border: 'none', borderRadius: '14px',
              padding: '14px 24px', color: '#FFF', fontWeight: '800',
              fontSize: '15px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#5A52E8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C63FF'}
          >
            ⚡ Cairkan Sekarang
            <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: '400' }}>
              · biaya {formatRupiah(INSTANT_FEE)}
            </span>
          </button>
        ) : balance?.availableBalance > 0 ? (
          <div style={{ background: '#1E1E3F', borderRadius: '12px', padding: '12px 16px', display: 'inline-block' }}>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>
              ⚡ Pencairan instan memerlukan saldo minimum {formatRupiah(INSTANT_MIN)}
            </p>
          </div>
        ) : null}

        {instantMsg === 'success' && (
          <div style={{ marginTop: '12px', background: '#10B98120', border: '1px solid #10B98140', borderRadius: '10px', padding: '12px' }}>
            <p style={{ color: '#10B981', fontSize: '13px' }}>
              ✅ Pencairan diproses! Dana akan masuk dalam ~10 menit.
            </p>
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🕐</span>
          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
            Pencairan otomatis gratis: 10:00, 15:00, 20:00 WIB
          </span>
        </div>
      </div>

      {/* Settlement History Table */}
      <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E1E3F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700' }}>Riwayat Pencairan</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #1E1E3F' }}>
          {['Tanggal', 'Bank', 'Jumlah', 'Biaya', 'Status'].map((h) => (
            <span key={h} style={{ color: '#6B7280', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Memuat...</div>
        ) : settlements.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏦</div>
            <p style={{ color: '#6B7280' }}>Belum ada pencairan</p>
          </div>
        ) : settlements.map((s) => {
          const badge = STATUS[s.status] || STATUS.PENDING;
          return (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
              padding: '14px 20px', borderBottom: '1px solid #0A0A1A',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A35'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>
                  {new Date(s.scheduledAt || s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {s.type === 'INSTANT' && (
                  <span style={{ fontSize: '10px', color: '#6C63FF', fontWeight: '700', background: '#6C63FF20', padding: '1px 6px', borderRadius: '4px' }}>
                    ⚡ Instan
                  </span>
                )}
              </div>
              <span style={{ color: '#9CA3AF', fontSize: '13px', alignSelf: 'center' }}>
                {s.bankCode} ••••{s.bankAccount?.slice(-4)}
              </span>
              <span style={{ color: '#FFF', fontSize: '13px', fontWeight: '700', alignSelf: 'center' }}>
                {formatRupiah(s.amount)}
              </span>
              <span style={{ color: s.fee > 0 ? '#EF4444' : '#6B7280', fontSize: '13px', alignSelf: 'center' }}>
                {s.fee > 0 ? `-${formatRupiah(s.fee)}` : 'Gratis'}
              </span>
              <span style={{ alignSelf: 'center' }}>
                <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                  {badge.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Instant Confirmation Modal */}
      {instantModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000CC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '20px', padding: '28px', width: '400px' }}>
            <h2 style={{ color: '#FFF', fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>⚡ Konfirmasi Pencairan</h2>
            {[
              { label: 'Saldo dicairkan', value: formatRupiah(balance?.availableBalance), valueStyle: {} },
              { label: 'Biaya admin', value: `- ${formatRupiah(INSTANT_FEE)}`, valueStyle: { color: '#EF4444' } },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#9CA3AF' }}>{r.label}</span>
                <span style={{ color: '#FFF', fontWeight: '700', ...r.valueStyle }}>{r.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1E1E3F', paddingTop: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#FFF', fontWeight: '800', fontSize: '16px' }}>Yang diterima</span>
              <span style={{ color: '#10B981', fontWeight: '900', fontSize: '20px' }}>
                {formatRupiah((balance?.availableBalance || 0) - INSTANT_FEE)}
              </span>
            </div>
            <div style={{ background: '#6C63FF15', border: '1px solid #6C63FF30', borderRadius: '10px', padding: '12px', marginBottom: '20px' }}>
              <p style={{ color: '#A78BFA', fontSize: '13px' }}>
                💡 Dana akan masuk ke rekening dalam ~10 menit (jam kerja bank 08:00–20:00 WIB)
              </p>
            </div>
            {instantMsg && instantMsg !== 'success' && (
              <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>⚠️ {instantMsg}</p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setInstantModal(false); setInstantMsg(''); }} disabled={instantLoading} style={{ flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F', borderRadius: '12px', padding: '12px', color: '#9CA3AF', cursor: 'pointer', fontWeight: '700' }}>
                Batal
              </button>
              <button onClick={handleInstant} disabled={instantLoading} style={{ flex: 2, background: '#6C63FF', border: 'none', borderRadius: '12px', padding: '12px', color: '#FFF', cursor: instantLoading ? 'not-allowed' : 'pointer', fontWeight: '800', opacity: instantLoading ? 0.7 : 1 }}>
                {instantLoading ? 'Memproses...' : '⚡ Cairkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
