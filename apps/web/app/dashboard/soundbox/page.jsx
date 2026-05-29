'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '../../../lib/api';
import { useDashboardStore } from '../../../lib/store';

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
}

export default function SoundboxPage() {
  const { activeStore } = useDashboardStore();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editVolume, setEditVolume] = useState(80);
  const [testingId, setTestingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDevices();
      setDevices(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (id) => {
    try {
      await dashboardApi.updateDevice(id, { name: editName, volume: editVolume });
      setEditId(null);
      load();
    } catch (err) { alert('Gagal menyimpan'); }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      await dashboardApi.testSound(id);
      alert('Test suara dikirim! ✅');
    } catch (err) {
      alert(err.message || 'Perangkat offline atau error');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>🔊 Soundbox</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
          {devices.filter((d) => d.isOnline).length}/{devices.length} perangkat online
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF' }}>Memuat...</p>
      ) : devices.length === 0 ? (
        <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔇</div>
          <p style={{ color: '#6B7280', marginBottom: '8px' }}>Belum ada perangkat soundbox</p>
          <p style={{ color: '#6B7280', fontSize: '13px' }}>Pair perangkat via aplikasi mobile → menu Soundbox</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {devices.map((device) => (
            <div key={device.id} style={{
              background: '#12122A',
              border: `1px solid ${device.isOnline ? '#10B98140' : '#1E1E3F'}`,
              borderRadius: '16px', padding: '20px',
            }}>
              {/* Status indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: device.isOnline ? '#10B981' : '#6B7280',
                    boxShadow: device.isOnline ? '0 0 8px #10B98180' : 'none',
                  }} />
                  <span style={{ color: device.isOnline ? '#10B981' : '#6B7280', fontSize: '12px', fontWeight: '700' }}>
                    {device.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <span style={{ color: '#6B7280', fontSize: '11px' }}>v{device.firmwareVer || '—'}</span>
              </div>

              {editId === device.id ? (
                <div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%', background: '#0A0A1A',
                      border: '1px solid #1E1E3F', borderRadius: '8px',
                      padding: '8px 12px', color: '#FFF', fontSize: '15px',
                      fontWeight: '700', outline: 'none', marginBottom: '12px',
                    }}
                  />
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px', display: 'block' }}>
                      Volume: {editVolume}%
                    </label>
                    <input
                      type="range" min="0" max="100"
                      value={editVolume}
                      onChange={(e) => setEditVolume(+e.target.value)}
                      style={{ width: '100%', accentColor: '#6C63FF' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleSave(device.id)} style={{
                      flex: 1, background: '#6C63FF', border: 'none',
                      borderRadius: '8px', padding: '8px', color: '#FFF',
                      fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                    }}>Simpan</button>
                    <button onClick={() => setEditId(null)} style={{
                      flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F',
                      borderRadius: '8px', padding: '8px', color: '#9CA3AF',
                      cursor: 'pointer', fontSize: '13px',
                    }}>Batal</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{device.name}</p>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>
                    📍 {device.store?.name || '—'}
                  </p>
                  <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '16px' }}>
                    🔉 Volume {device.volume}% · Terakhir aktif{' '}
                    {device.lastSeenAt
                      ? new Date(device.lastSeenAt).toLocaleString('id-ID')
                      : '—'
                    }
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditId(device.id); setEditName(device.name); setEditVolume(device.volume); }} style={{
                      flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F',
                      borderRadius: '8px', padding: '8px', color: '#FFF',
                      cursor: 'pointer', fontSize: '13px',
                    }}>✏️ Edit</button>
                    <button
                      onClick={() => handleTest(device.id)}
                      disabled={!device.isOnline || testingId === device.id}
                      style={{
                        flex: 1, background: device.isOnline ? '#10B98120' : '#1A1A35',
                        border: `1px solid ${device.isOnline ? '#10B981' : '#1E1E3F'}`,
                        borderRadius: '8px', padding: '8px',
                        color: device.isOnline ? '#10B981' : '#6B7280',
                        cursor: device.isOnline ? 'pointer' : 'not-allowed',
                        fontSize: '13px', fontWeight: '600',
                      }}
                    >
                      {testingId === device.id ? '⏳' : '🔔'} Test
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
