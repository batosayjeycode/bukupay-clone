import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { statusColors, statusLabels } from '../../utils/formatters';

const MENU_ITEMS = [
  { icon: '🏪', label: 'Kelola Toko', action: 'stores' },
  { icon: '🏦', label: 'Rekening Bank', action: 'bank' },
  { icon: '🔔', label: 'Notifikasi', action: 'notification' },
  { icon: '🔒', label: 'Keamanan', action: 'security' },
  { icon: '❓', label: 'Bantuan & FAQ', action: 'help' },
  { icon: '📞', label: 'Hubungi CS', action: 'contact' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const kycColor = statusColors[user?.kycStatus] || '#6B7280';
  const kycLabel = statusLabels[user?.kycStatus] || 'Belum Diverifikasi';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      <Text style={styles.title}>Profil Saya</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName[0].toUpperCase() : '👤'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.fullName || 'Merchant BukuPay'}
          </Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
          <View style={[styles.kycBadge, { backgroundColor: kycColor + '20' }]}>
            <View style={[styles.kycDot, { backgroundColor: kycColor }]} />
            <Text style={[styles.kycText, { color: kycColor }]}>KYC: {kycLabel}</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.action}
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>BukuPay v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 BukuPay. All rights reserved.</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  content: { padding: 20, paddingBottom: 60 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 60,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E1E3F',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C63FF20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#6C63FF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  profilePhone: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  kycText: { fontSize: 11, fontWeight: '600' },
  menuSection: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E3F',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3F',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: 15, color: '#FFFFFF' },
  menuChevron: { fontSize: 20, color: '#6B7280' },
  appInfo: { alignItems: 'center', marginBottom: 20 },
  appVersion: { color: '#6B7280', fontSize: 13 },
  appCopyright: { color: '#4B5563', fontSize: 11, marginTop: 4 },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
