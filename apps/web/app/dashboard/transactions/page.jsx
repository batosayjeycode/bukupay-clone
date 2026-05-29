'use client';

import { useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '../../../lib/api';
import { useDashboardStore } from '../../../lib/store';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
}

const STATUS_BADGE = {
  PAID: { label: 'Lunas', color: '#10B981', bg: '#10B98120' },
  PENDING: { label: 'Menunggu', color: '#F59E0B', bg: '#F59E0B20' },
  FAILED: { label: 'Gagal', color: '#EF4444', bg: '#EF444420' },
  REFUNDED: { label: 'Dikembalikan', color: '#6B7280', bg: '#6B728020' },
};

export default function TransactionsPage() {
  const { activeStore } = useDashboardStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getTransactions({
        storeId: activeStore?.id,
        status: filter.status || undefined,
        page,
        limit: LIMIT,
      });
      setTransactions(res.data?.transactions || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeStore, filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const storeId = activeStore?.id || '';
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = dashboardApi.exportCsv(storeId, thirtyDaysAgo, today);
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>📋 Transaksi</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Total {total} transaksi</p>
        </div>
        <button
          onClick={handleExport}
          style={{
            background: '#1A1A35', border: '1px solid #1E1E3F',
            borderRadius: '10px', padding: '10px 16px',
            color: '#FFF', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
          }}
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select
          value={filter.status}
          onChange={(e) => { setFilter((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{
            background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '10px',
            padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none',
          }}
        >
          <option value="">Semua Status</option>
          <option value="PAID">Lunas</option>
          <option value="PENDING">Menunggu</option>
          <option value="FAILED">Gagal</option>
          <option value="REFUNDED">Dikembalikan</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: '#12122A', border: '1px solid #1E1E3F',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
          padding: '14px 20px',
          borderBottom: '1px solid #1E1E3F',
        }}>
          {['Waktu', 'Toko', 'Jumlah', 'Diterima', 'Status'].map((h) => (
            <span key={h} style={{ color: '#6B7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Memuat...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#6B7280' }}>Belum ada transaksi</p>
          </div>
        ) : transactions.map((tx) => {
          const badge = STATUS_BADGE[tx.status] || STATUS_BADGE.PENDING;
          return (
            <div key={tx.id} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
              padding: '14px 20px',
              borderBottom: '1px solid #1E1E3F',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A35'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>
                  {tx.paidAt ? new Date(tx.paidAt).toLocaleString('id-ID') : '—'}
                </p>
                <p style={{ color: '#6B7280', fontSize: '11px' }}>{tx.id.slice(-8)}</p>
              </div>
              <span style={{ color: '#9CA3AF', fontSize: '13px', alignSelf: 'center' }}>
                {tx.store?.name || '—'}
              </span>
              <span style={{ color: '#FFF', fontSize: '13px', fontWeight: '700', alignSelf: 'center' }}>
                {formatRupiah(tx.amount)}
              </span>
              <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '600', alignSelf: 'center' }}>
                {formatRupiah(tx.netAmount)}
              </span>
              <span style={{ alignSelf: 'center' }}>
                <span style={{
                  background: badge.bg, color: badge.color,
                  borderRadius: '20px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: '700',
                }}>
                  {badge.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '8px',
              padding: '8px 16px', color: page === 1 ? '#6B7280' : '#FFF', cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >← Prev</button>
          <span style={{ color: '#9CA3AF', alignSelf: 'center', fontSize: '13px' }}>
            Halaman {page} dari {Math.ceil(total / LIMIT)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / LIMIT)}
            style={{
              background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '8px',
              padding: '8px 16px', color: page >= Math.ceil(total / LIMIT) ? '#6B7280' : '#FFF',
              cursor: page >= Math.ceil(total / LIMIT) ? 'not-allowed' : 'pointer',
            }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
