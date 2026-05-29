'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '../../lib/api';
import { useDashboardStore, useAuthStore } from '../../lib/store';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

function formatRupiah(amount) {
  if (!amount) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function KpiCard({ title, value, subtitle, icon, trend }) {
  const isPositive = trend && !trend.startsWith('-');
  return (
    <div style={{
      background: '#12122A', border: '1px solid #1E1E3F',
      borderRadius: '16px', padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>{title}</p>
          <p style={{ color: '#FFF', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{value}</p>
          {subtitle && <p style={{ color: '#6B7280', fontSize: '12px' }}>{subtitle}</p>}
        </div>
        <span style={{ fontSize: '28px' }}>{icon}</span>
      </div>
      {trend && (
        <div style={{ marginTop: '12px' }}>
          <span style={{
            fontSize: '12px', fontWeight: '600',
            color: isPositive ? '#10B981' : '#EF4444',
          }}>
            {isPositive ? '↑' : '↓'} {trend} vs kemarin
          </span>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#12122A', border: '1px solid #1E1E3F',
      borderRadius: '10px', padding: '12px',
    }}>
      <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: '#6C63FF', fontSize: '14px', fontWeight: '700' }}>
          {p.dataKey === 'revenue' ? formatRupiah(p.value) : `${p.value}x`}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { activeStore } = useDashboardStore();
  const { user } = useAuthStore();
  const [report, setReport] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [soundboxes, setSoundboxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeStore]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const storeId = activeStore?.id || null;

      const [daily, weekly, devices] = await Promise.all([
        dashboardApi.getDailyReport(storeId, today),
        dashboardApi.getWeeklyReport(storeId, null),
        dashboardApi.getDevices(),
      ]);

      setReport(daily.data);
      setWeeklyData(weekly.data?.daily || []);
      setSoundboxes(devices.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';
  const onlineSoundboxes = soundboxes.filter((d) => d.isOnline).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#9CA3AF' }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFF', marginBottom: '4px' }}>
          {greeting}, {user?.fullName?.split(' ')[0] || 'Merchant'} 👋
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
          {activeStore ? `📍 ${activeStore.name}` : 'Semua Toko'} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <KpiCard
          title="Pemasukan Hari Ini"
          value={formatRupiah(report?.totalRevenue)}
          subtitle={`${report?.txCount || 0} transaksi`}
          icon="💰"
        />
        <KpiCard
          title="Rata-rata Transaksi"
          value={formatRupiah(report?.avgTransaction)}
          subtitle="Hari ini"
          icon="📊"
        />
        <KpiCard
          title="Biaya MDR"
          value={formatRupiah(report?.totalFee)}
          subtitle="Dipotong otomatis"
          icon="🏦"
        />
        <KpiCard
          title="Soundbox Online"
          value={`${onlineSoundboxes}/${soundboxes.length}`}
          subtitle={onlineSoundboxes === soundboxes.length ? 'Semua aktif ✅' : 'Ada yang offline ⚠️'}
          icon="🔊"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* Revenue Chart */}
        <div style={{
          background: '#12122A', border: '1px solid #1E1E3F',
          borderRadius: '16px', padding: '20px',
        }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>
            📈 Pendapatan 7 Hari Terakhir
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E3F" />
              <XAxis dataKey="dayName" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="revenue"
                stroke="#6C63FF" strokeWidth={2}
                dot={{ fill: '#6C63FF', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Bar Chart */}
        <div style={{
          background: '#12122A', border: '1px solid #1E1E3F',
          borderRadius: '16px', padding: '20px',
        }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>
            🕐 Transaksi per Jam Hari Ini
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report?.hourly || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E3F" />
              <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="txCount" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Soundbox Status */}
      {soundboxes.length > 0 && (
        <div style={{
          background: '#12122A', border: '1px solid #1E1E3F',
          borderRadius: '16px', padding: '20px',
        }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>
            🔊 Status Perangkat Soundbox
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {soundboxes.map((device) => (
              <div key={device.id} style={{
                background: '#0A0A1A', border: `1px solid ${device.isOnline ? '#10B981' : '#1E1E3F'}`,
                borderRadius: '12px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: device.isOnline ? '#10B981' : '#6B7280',
                }} />
                <div>
                  <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>{device.name}</p>
                  <p style={{ color: '#6B7280', fontSize: '11px' }}>
                    {device.isOnline ? 'Online' : 'Offline'}
                    {device.lastSeenAt && ` — ${new Date(device.lastSeenAt).toLocaleTimeString('id-ID')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
