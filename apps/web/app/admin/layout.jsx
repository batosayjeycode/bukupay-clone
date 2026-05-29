'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/merchants', icon: '🏪', label: 'Merchant' },
  { href: '/admin/logs', icon: '📋', label: 'Activity Log' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, token, isAdmin, loadFromSession, logout } = useAuthStore();

  useEffect(() => {
    loadFromSession();
    if (!token) router.push('/login');
    else if (!isAdmin) router.push('/dashboard');
  }, []);

  if (!token || !isAdmin) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A1A' }}>
      <aside style={{
        width: '220px', background: '#0D0D20',
        borderRight: '1px solid #1E1E3F',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1E1E3F' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🛡️</span>
            <div>
              <p style={{ fontWeight: '800', color: '#FFF', fontSize: '14px' }}>BukuPay Admin</p>
              <p style={{ color: '#EF444480', fontSize: '11px', fontWeight: '700' }}>INTERNAL ONLY</p>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                color: '#9CA3AF', fontSize: '14px', cursor: 'pointer',
              }}>
                <span>{item.icon}</span>{item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1E1E3F' }}>
          <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600' }}>{user?.fullName}</p>
          <p style={{ color: '#EF4444', fontSize: '11px' }}>Admin</p>
          <button onClick={() => { logout(); router.push('/login'); }} style={{
            marginTop: '8px', width: '100%', background: 'none',
            border: '1px solid #EF4444', borderRadius: '8px',
            padding: '7px', color: '#EF4444', cursor: 'pointer', fontSize: '12px',
          }}>Keluar</button>
        </div>
      </aside>
      <main style={{ marginLeft: '220px', flex: 1 }}>{children}</main>
    </div>
  );
}
