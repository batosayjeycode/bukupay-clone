'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '../../../lib/api';
import { useDashboardStore } from '../../../lib/store';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
}

function formatShort(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '12px' }}>
      <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: '#6C63FF', fontSize: '14px', fontWeight: '700' }}>
          {p.dataKey === 'revenue' ? formatRupiah(p.value) : `${p.value}x`}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { activeStore } = useDashboardStore();
  const [period, setPeriod] = useState('monthly');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState(null);
  const [topHours, setTopHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportRange, setExportRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    const storeId = activeStore?.id || null;
    try {
      const [rep, hours] = await Promise.all([
        period === 'daily'
          ? dashboardApi.getDailyReport(storeId, null)
          : period === 'weekly'
          ? dashboardApi.getWeeklyReport(storeId, null)
          : dashboardApi.getMonthlyReport(storeId, month),
        dashboardApi.getTopHours(storeId),
      ]);
      setReport(rep.data);
      setTopHours(hours.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeStore, period, month]);

  const handleExport = () => {
    const url = dashboardApi.exportCsv(activeStore?.id, exportRange.start, exportRange.end);
    window.open(url, '_blank');
  };

  const chartData = report?.daily || report?.weekly || report?.hourly || [];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>📊 Laporan</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Analisis pendapatan dan transaksi</p>
        </div>

        {/* Period Toggle */}
        <div style={{ display: 'flex', background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '12px', padding: '4px' }}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: period === p ? '#6C63FF' : 'transparent',
              color: period === p ? '#FFF' : '#9CA3AF',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              transition: 'all 0.15s',
            }}>
              {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
      </div>

      {period === 'monthly' && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '10px',
              padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none',
            }}
          />
        </div>
      )}

      {/* KPI Summary */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Pendapatan', value: formatRupiah(report.totalRevenue), icon: '💰' },
            { label: 'Pendapatan Bersih', value: formatRupiah(report.netRevenue), icon: '✅' },
            { label: 'Jumlah Transaksi', value: `${report.txCount}x`, icon: '📋' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>{kpi.label}</p>
                <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
              </div>
              <p style={{ color: '#FFF', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>
            📈 Grafik Pendapatan
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            {period === 'daily' ? (
              <BarChart data={report?.hourly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E3F" />
                <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis tickFormatter={formatShort} tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E3F" />
                <XAxis dataKey={period === 'weekly' ? 'dayName' : 'weekStart'} tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis tickFormatter={formatShort} tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={2} dot={{ r: 4, fill: '#6C63FF' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Top Hours */}
        <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>
            🕐 Jam Tersibuk (7 Hari)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topHours.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E3F" />
              <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="txCount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Days (monthly only) */}
      {period === 'monthly' && report?.topDays?.length > 0 && (
        <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>🏆 5 Hari Terbaik Bulan Ini</h2>
          {report.topDays.map((day, i) => (
            <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E1E3F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#6C63FF', fontWeight: '800', fontSize: '16px' }}>#{i + 1}</span>
                <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#FFF', fontWeight: '700', fontSize: '14px' }}>{formatRupiah(day.revenue)}</p>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>{day.txCount} transaksi</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Section */}
      <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ color: '#FFF', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>⬇️ Export Data</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Dari</label>
            <input
              type="date"
              value={exportRange.start}
              onChange={(e) => setExportRange((r) => ({ ...r, start: e.target.value }))}
              style={{ background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '8px', padding: '8px 12px', color: '#FFF', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Sampai</label>
            <input
              type="date"
              value={exportRange.end}
              onChange={(e) => setExportRange((r) => ({ ...r, end: e.target.value }))}
              style={{ background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '8px', padding: '8px 12px', color: '#FFF', outline: 'none' }}
            />
          </div>
          <button onClick={handleExport} style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#6C63FF', border: 'none', borderRadius: '10px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            ⬇️ Export CSV
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '8px' }}>Maksimal 90 hari per export. File akan otomatis terdownload.</p>
      </div>
    </div>
  );
}
