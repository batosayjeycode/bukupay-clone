import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { settlementApi } from '../../api/services';
import { formatRupiah, formatDate, statusColors, statusLabels } from '../../utils/formatters';
import { useMerchantStore } from '../../stores/merchantStore';

export default function SettlementScreen() {
  const { activeStore } = useMerchantStore();
  const [balance, setBalance] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balResult, settleResult] = await Promise.all([
        settlementApi.getBalance(),
        settlementApi.getHistory({ limit: 20 }),
      ]);
      setBalance(balResult.data);
      setSettlements(settleResult.data.settlements);
    } catch (err) {
      console.error('Settlement fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const renderSettlement = ({ item }) => (
    <View style={styles.settlementItem}>
      <View style={styles.settleLeft}>
        <View style={[styles.settleIcon, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text>{item.status === 'COMPLETED' ? '✅' : item.status === 'FAILED' ? '❌' : '⏳'}</Text>
        </View>
        <View>
          <Text style={styles.settleAmount}>{formatRupiah(item.amount)}</Text>
          <Text style={styles.settleBank}>
            {item.bankCode} ••••{item.bankAccount.slice(-4)}
          </Text>
          <Text style={styles.settleDate}>{formatDate(item.scheduledAt)}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
        <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
          {statusLabels[item.status]}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      <FlatList
        data={settlements}
        keyExtractor={(item) => item.id}
        renderItem={renderSettlement}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Dana & Pencairan</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo Tersedia</Text>
              <Text style={styles.balanceValue}>
                {formatRupiah(balance?.availableBalance || 0)}
              </Text>
              <View style={styles.balanceDetails}>
                <View style={styles.balanceDetailItem}>
                  <Text style={styles.detailLabel}>Total Pemasukan</Text>
                  <Text style={styles.detailValue}>
                    {formatRupiah(balance?.totalEarned || 0)}
                  </Text>
                </View>
                <View style={styles.balanceDetailItem}>
                  <Text style={styles.detailLabel}>Total Dicairkan</Text>
                  <Text style={styles.detailValue}>
                    {formatRupiah(balance?.totalSettled || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>🕐</Text>
                <Text style={styles.scheduleText}>
                  Pencairan otomatis: 10:00, 15:00, 20:00 WIB
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Riwayat Pencairan</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyText}>Belum ada pencairan dana</Text>
            <Text style={styles.emptyDesc}>
              Pencairan akan otomatis dilakukan 3x sehari saat saldo tersedia
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  loading: { flex: 1, backgroundColor: '#0A0A1A', alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  header: { paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  balanceCard: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6C63FF40',
  },
  balanceLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  balanceDetails: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  balanceDetailItem: { flex: 1 },
  detailLabel: { color: '#6B7280', fontSize: 11, marginBottom: 4 },
  detailValue: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  scheduleIcon: { fontSize: 16 },
  scheduleText: { color: '#9CA3AF', fontSize: 12, flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#12122A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  settleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleAmount: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  settleBank: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  settleDate: { fontSize: 11, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
