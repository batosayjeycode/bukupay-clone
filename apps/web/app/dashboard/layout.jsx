'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useDashboardStore } from '../../lib/store';
import { dashboardApi } from '../../lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Beranda' },
  { href: '/dashboard/transactions', icon: '📋', label: 'Transaksi' },
  { href: '/dashboard/settlements', icon: '💰', label: 'Pencairan' },
  { href: '/dashboard/reports', icon: '📊', label: 'Laporan' },
  { href: '/dashboard/employees', icon: '👥', label: 'Karyawan' },
  { href: '/dashboard/soundbox', icon: '🔊', label: 'Soundbox' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Pengaturan' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loadFromSession, logout } = useAuthStore();
  const { stores, activeStore, setStores, setActiveStore } = useDashboardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadFromSession();
    if (!token && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (token && stores.length === 0) {
      dashboardApi.getStores().then((res) => setStores(res.data || [])).catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!token) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A1A' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#12122A',
        borderRight: '1px solid #1E1E3F',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        overflowY: 'auto',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1E1E3F' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>💳</span>
            <div>
              <p style={{ fontWeight: '800', color: '#FFF', fontSize: '16px' }}>BukuPay</p>
              <p style={{ color: '#6B7280', fontSize: '11px' }}>Dashboard v2.0</p>
            </div>
          </div>
        </div>

        {/* Store Selector */}
        {stores.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E3F' }}>
            <label style={{ color: '#6B7280', fontSize: '11px', marginBottom: '6px', display: 'block' }}>
              TOKO AKTIF
            </label>
            <select
              value={activeStore?.id || ''}
              onChange={(e) => {
                const store = stores.find((s) => s.id === e.target.value);
                if (store) setActiveStore(store);
              }}
              style={{
                width: '100%', background: '#0A0A1A',
                border: '1px solid #1E1E3F', borderRadius: '8px',
                padding: '8px', color: '#FFF', fontSize: '13px', outline: 'none',
              }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  marginBottom: '4px',
                  background: isActive ? '#6C63FF20' : 'transparent',
                  color: isActive ? '#6C63FF' : '#9CA3AF',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div style={{
                      marginLeft: 'auto', width: '4px', height: '4px',
                      borderRadius: '50%', background: '#6C63FF',
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #1E1E3F' }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>
              {user?.fullName || 'Merchant'}
            </p>
            <p style={{ color: '#6B7280', fontSize: '11px' }}>{user?.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'none',
              border: '1px solid #EF4444', borderRadius: '8px',
              padding: '8px', color: '#EF4444',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
