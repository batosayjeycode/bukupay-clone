import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useMerchantStore } from '../../stores/merchantStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { formatRupiah, formatShortDate, statusColors, statusLabels } from '../../utils/formatters';

export default function HomeScreen({ navigation }) {
  const { activeStore, stores, loadStores, generateQris } = useMerchantStore();
  const { transactions, todayTotal, todayCount, loadTransactions } = useTransactionStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await loadStores();
      if (activeStore) {
        await loadTransactions({ storeId: activeStore.id, reset: true });
      }
    } catch (err) {
      console.error('Load data error:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeStore]);

  const handleGenerateQris = async () => {
    if (!activeStore) return;
    try {
      await generateQris(activeStore.id);
    } catch (err) {
      console.error('Generate QRIS error:', err);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Selamat {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Pemilik'} 👋
          </Text>
          <Text style={styles.storeName}>{activeStore?.name || 'Pilih Toko'}</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Today Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pemasukan Hari Ini</Text>
            <Text style={styles.statValue}>{formatRupiah(todayTotal)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Transaksi</Text>
            <Text style={styles.statValue}>{todayCount}x</Text>
          </View>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>QRIS Toko Anda</Text>

        {activeStore?.qrisCode ? (
          <>
            <View style={styles.qrContainer}>
              <QRCode
                value={activeStore.qrisCode}
                size={220}
                backgroundColor="#FFFFFF"
                color="#0A0A1A"
              />
            </View>
            <Text style={styles.qrHint}>
              📱 Minta pelanggan scan QR ini untuk bayar
            </Text>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Bagikan QRIS</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noQrContainer}>
            <Text style={styles.noQrIcon}>📲</Text>
            <Text style={styles.noQrText}>QRIS belum aktif</Text>
            <Text style={styles.noQrDesc}>Aktifkan QRIS untuk mulai menerima pembayaran</Text>
            <TouchableOpacity style={styles.activateButton} onPress={handleGenerateQris}>
              <Text style={styles.activateButtonText}>Aktifkan QRIS →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.txSection}>
        <View style={styles.txHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionTab')}>
            <Text style={styles.seeAll}>Lihat semua →</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txItem}
              onPress={() => navigation.navigate('TransactionTab', {
                screen: 'TransactionDetail',
                params: { id: tx.id }
              })}
            >
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: statusColors[tx.status] + '20' }]}>
                  <Text>{tx.status === 'PAID' ? '✅' : '⏳'}</Text>
                </View>
                <View>
                  <Text style={styles.txAmount}>{formatRupiah(tx.amount)}</Text>
                  <Text style={styles.txDate}>{formatShortDate(tx.paidAt || tx.createdAt)}</Text>
                </View>
              </View>
              <View style={[styles.txBadge, { backgroundColor: statusColors[tx.status] + '20' }]}>
                <Text style={[styles.txStatus, { color: statusColors[tx.status] }]}>
                  {statusLabels[tx.status]}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyTx}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Pagi';
  if (hour < 15) return 'Siang';
  if (hour < 19) return 'Sore';
  return 'Malam';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 60,
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  storeName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#12122A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 20 },
  statsCard: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  divider: { width: 1, height: 40, backgroundColor: '#1E1E3F' },
  qrSection: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
  },
  qrHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  shareButton: {
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  shareButtonText: { color: '#6C63FF', fontWeight: '600' },
  noQrContainer: { alignItems: 'center', padding: 20 },
  noQrIcon: { fontSize: 56, marginBottom: 12 },
  noQrText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  noQrDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  activateButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  activateButtonText: { color: '#FFFFFF', fontWeight: '700' },
  txSection: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3F',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  txDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  txStatus: { fontSize: 12, fontWeight: '600' },
  emptyTx: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#6B7280', fontSize: 14 },
});
