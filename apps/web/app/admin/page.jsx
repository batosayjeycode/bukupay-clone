'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((res) => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '32px', color: '#9CA3AF' }}>Memuat...</div>;

  const kpis = [
    { label: 'Total Merchant', value: stats?.totalMerchants?.toLocaleString(), icon: '🏪', color: '#6C63FF' },
    { label: 'Merchant Terverifikasi', value: stats?.verifiedMerchants?.toLocaleString(), icon: '✅', color: '#10B981' },
    { label: 'KYC Menunggu Review', value: stats?.pendingKyc?.toLocaleString(), icon: '⏳', color: '#F59E0B', urgent: stats?.pendingKyc > 0 },
    { label: 'Soundbox Online', value: stats?.activeSoundboxes?.toLocaleString(), icon: '🔊', color: '#6C63FF' },
    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats?.today?.revenue), icon: '💰', color: '#10B981' },
    { label: 'Transaksi Hari Ini', value: `${stats?.today?.txCount}x`, icon: '📋', color: '#9CA3AF' },
  ];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>🛡️ Admin Dashboard</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Statistik platform BukuPay secara keseluruhan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{
            background: '#12122A',
            border: `1px solid ${kpi.urgent ? '#F59E0B40' : '#1E1E3F'}`,
            borderRadius: '16px', padding: '20px',
            boxShadow: kpi.urgent ? '0 0 16px #F59E0B20' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>{kpi.label}</p>
              <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
            </div>
            <p style={{ color: kpi.color, fontSize: '26px', fontWeight: '800' }}>{kpi.value}</p>
            {kpi.urgent && (
              <p style={{ color: '#F59E0B', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                ⚠️ Perlu direview
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>📈 Total Pendapatan Platform</h2>
        <p style={{ color: '#6C63FF', fontSize: '36px', fontWeight: '900' }}>
          {formatRupiah(stats?.allTime?.revenue)}
        </p>
        <p style={{ color: '#6B7280', fontSize: '13px' }}>Seluruh transaksi sejak platform diluncurkan</p>
      </div>
    </div>
  );
}
