'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '../../../lib/api';
import { useDashboardStore } from '../../../lib/store';

export default function EmployeesPage() {
  const { activeStore, stores } = useDashboardStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePerms, setInvitePerms] = useState({ canRefund: false, canViewReport: false, canManageEmployees: false });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [pinModal, setPinModal] = useState(null); // employee object
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const load = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await dashboardApi.getEmployees(activeStore.id);
      setEmployees(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeStore]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invitePhone) return;
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const res = await dashboardApi.inviteEmployee({ storeId: activeStore.id, phone: invitePhone, permissions: invitePerms });
      setInviteResult({ success: true, url: res.data?.inviteUrl, wasSent: res.data?.whatsappSent });
      setInvitePhone('');
    } catch (err) {
      setInviteResult({ success: false, msg: err.message || 'Gagal mengirim undangan' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (emp) => {
    if (!confirm(`Hapus karyawan ini dari ${activeStore?.name}?`)) return;
    try {
      await dashboardApi.removeEmployee(emp.id);
      load();
    } catch (err) { alert('Gagal menghapus karyawan'); }
  };

  const handleTogglePerm = async (emp, key) => {
    const newPerms = { ...(emp.permissions || {}), [key]: !(emp.permissions?.[key]) };
    try {
      await dashboardApi.updatePermissions(emp.id, newPerms);
      setEmployees((prev) => prev.map((e) => e.id === emp.id ? { ...e, permissions: newPerms } : e));
    } catch { alert('Gagal mengubah permission'); }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 6) return;
    setPinLoading(true);
    try {
      // POST /api/employee/:id/pin
      const res = await fetch(`/api/v1/employee/${pinModal.id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('bukupay_token')}` },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) { setPinModal(null); setPin(''); alert('PIN berhasil diatur!'); }
      else alert(data.message || 'Gagal mengatur PIN');
    } catch { alert('Terjadi kesalahan'); }
    finally { setPinLoading(false); }
  };

  const PERMS = [
    { key: 'canRefund', label: 'Refund Transaksi', icon: '↩️' },
    { key: 'canViewReport', label: 'Lihat Laporan', icon: '📊' },
    { key: 'canManageEmployees', label: 'Kelola Karyawan', icon: '👥' },
  ];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFF' }}>👥 Karyawan</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {activeStore?.name} — {employees.length} karyawan
          </p>
        </div>
        <button
          onClick={() => { setInviteModal(true); setInviteResult(null); }}
          disabled={!activeStore}
          style={{ background: '#6C63FF', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
        >
          + Undang Karyawan
        </button>
      </div>

      {!activeStore ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#12122A', borderRadius: '16px', border: '1px solid #1E1E3F' }}>
          <p style={{ color: '#6B7280' }}>Pilih toko dari sidebar untuk melihat karyawan</p>
        </div>
      ) : loading ? (
        <p style={{ color: '#9CA3AF' }}>Memuat...</p>
      ) : employees.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#12122A', borderRadius: '16px', border: '1px solid #1E1E3F' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
          <p style={{ color: '#FFF', fontWeight: '700', marginBottom: '8px' }}>Belum ada karyawan</p>
          <p style={{ color: '#6B7280', fontSize: '13px' }}>Klik "+ Undang Karyawan" untuk menambah kasir</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {employees.map((emp) => {
            const perms = emp.permissions || {};
            return (
              <div key={emp.id} style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#1A1A35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                    <div>
                      <p style={{ color: '#FFF', fontWeight: '700' }}>ID: ...{emp.userId?.slice(-8)}</p>
                      <p style={{ color: '#6C63FF', fontSize: '12px' }}>Kasir</p>
                      {emp.joinedAt && (
                        <p style={{ color: '#6B7280', fontSize: '11px' }}>
                          Bergabung {new Date(emp.joinedAt).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPinModal(emp)}
                      style={{ background: '#1A1A35', border: '1px solid #1E1E3F', borderRadius: '8px', padding: '6px 12px', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🔑 Set PIN
                    </button>
                    <button
                      onClick={() => handleRemove(emp)}
                      style={{ background: '#EF444420', border: '1px solid #EF444440', borderRadius: '8px', padding: '6px 12px', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ borderTop: '1px solid #1E1E3F', paddingTop: '14px' }}>
                  <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Permissions</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {PERMS.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => handleTogglePerm(emp, key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                          background: perms[key] ? '#6C63FF20' : '#1A1A35',
                          border: `1px solid ${perms[key] ? '#6C63FF' : '#1E1E3F'}`,
                          color: perms[key] ? '#6C63FF' : '#6B7280',
                          fontWeight: perms[key] ? '700' : '400',
                          transition: 'all 0.15s',
                        }}
                      >
                        {icon} {label}
                        {perms[key] && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000CC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '20px', padding: '28px', width: '420px' }}>
            <h2 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Undang Karyawan</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>{activeStore?.name}</p>

            {inviteResult?.success ? (
              <div>
                <div style={{ background: '#10B98120', border: '1px solid #10B98140', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <p style={{ color: '#10B981', fontWeight: '700', marginBottom: '8px' }}>
                    ✅ {inviteResult.wasSent ? 'Undangan dikirim via WhatsApp!' : 'Link undangan dibuat!'}
                  </p>
                  {inviteResult.url && (
                    <p style={{ color: '#9CA3AF', fontSize: '12px', wordBreak: 'break-all' }}>
                      {inviteResult.url}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setInviteResult(null); }} style={{ flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px', color: '#9CA3AF', cursor: 'pointer' }}>Undang Lagi</button>
                  <button onClick={() => { setInviteModal(false); setInviteResult(null); }} style={{ flex: 1, background: '#6C63FF', border: 'none', borderRadius: '10px', padding: '10px', color: '#FFF', fontWeight: '700', cursor: 'pointer' }}>Selesai</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <label style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nomor HP Kasir</label>
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <span style={{ background: '#0A0A1A', border: '1px solid #1E1E3F', borderRight: 'none', borderRadius: '10px 0 0 10px', padding: '10px 12px', color: '#9CA3AF', fontSize: '14px' }}>🇮🇩 +62</span>
                  <input
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="81234567890"
                    style={{ flex: 1, background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '0 10px 10px 0', padding: '10px 14px', color: '#FFF', outline: 'none', fontSize: '14px' }}
                    required
                  />
                </div>

                <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>Hak Akses</p>
                {PERMS.map(({ key, label, icon }) => (
                  <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0A0A1A', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                    <span style={{ color: '#D1D5DB', fontSize: '14px' }}>{icon} {label}</span>
                    <input
                      type="checkbox"
                      checked={invitePerms[key]}
                      onChange={() => setInvitePerms((p) => ({ ...p, [key]: !p[key] }))}
                      style={{ accentColor: '#6C63FF', width: '16px', height: '16px' }}
                    />
                  </label>
                ))}

                {inviteResult?.success === false && (
                  <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>⚠️ {inviteResult.msg}</p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setInviteModal(false)} style={{ flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px', color: '#9CA3AF', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={inviteLoading} style={{ flex: 2, background: '#6C63FF', border: 'none', borderRadius: '10px', padding: '10px', color: '#FFF', fontWeight: '700', cursor: 'pointer', opacity: inviteLoading ? 0.7 : 1 }}>
                    {inviteLoading ? 'Mengirim...' : '📨 Kirim via WhatsApp'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000CC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12122A', border: '1px solid #1E1E3F', borderRadius: '20px', padding: '28px', width: '360px' }}>
            <h2 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>🔑 Set PIN Kasir</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>ID: ...{pinModal.userId?.slice(-8)}</p>
            <form onSubmit={handleSetPin}>
              <label style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '8px', display: 'block' }}>PIN 6 Digit</label>
              <input
                type="number"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ width: '100%', background: '#0A0A1A', border: '1px solid #1E1E3F', borderRadius: '12px', padding: '14px', color: '#FFF', fontSize: '28px', textAlign: 'center', letterSpacing: '10px', outline: 'none', marginBottom: '20px' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { setPinModal(null); setPin(''); }} style={{ flex: 1, background: '#1A1A35', border: '1px solid #1E1E3F', borderRadius: '10px', padding: '10px', color: '#9CA3AF', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={pinLoading || pin.length < 6} style={{ flex: 2, background: '#6C63FF', border: 'none', borderRadius: '10px', padding: '10px', color: '#FFF', fontWeight: '700', cursor: 'pointer', opacity: (pinLoading || pin.length < 6) ? 0.6 : 1 }}>
                  {pinLoading ? 'Menyimpan...' : '💾 Simpan PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
