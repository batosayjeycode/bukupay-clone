import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTransactionStore } from '../../stores/transactionStore';
import { useMerchantStore } from '../../stores/merchantStore';
import { formatRupiah, formatDate, statusColors, statusLabels } from '../../utils/formatters';

const FILTER_OPTIONS = [
  { label: 'Semua', value: null },
  { label: 'Berhasil', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Gagal', value: 'FAILED' },
];

export default function TransactionListScreen({ navigation }) {
  const { transactions, isLoading, hasMore, loadTransactions, reset } = useTransactionStore();
  const { activeStore } = useMerchantStore();
  const [activeFilter, setActiveFilter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions(true);
  }, [activeFilter, activeStore]);

  const fetchTransactions = async (resetData = false) => {
    if (resetData) reset();
    await loadTransactions({
      storeId: activeStore?.id,
      status: activeFilter,
      reset: resetData,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions(true);
    setRefreshing(false);
  }, [activeFilter, activeStore]);

  const onEndReached = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.txItem}
      onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIconBg,
            { backgroundColor: statusColors[item.status] + '20' },
          ]}
        >
          <Text style={styles.txIcon}>
            {item.status === 'PAID' ? '✅' : item.status === 'FAILED' ? '❌' : '⏳'}
          </Text>
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txAmount}>{formatRupiah(item.amount)}</Text>
          <Text style={styles.txStore}>{item.store?.name}</Text>
          <Text style={styles.txDate}>{formatDate(item.paidAt || item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.txRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {statusLabels[item.status]}
          </Text>
        </View>
        {item.fee > 0 && (
          <Text style={styles.feeText}>MDR: {formatRupiah(item.fee)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilter = () => (
    <View style={styles.filterContainer}>
      {FILTER_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={String(opt.value)}
          style={[
            styles.filterChip,
            activeFilter === opt.value && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter(opt.value)}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === opt.value && styles.filterTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.subtitle}>{activeStore?.name || 'Semua Toko'}</Text>
      </View>

      {renderFilter()}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
        ListFooterComponent={
          isLoading && !refreshing ? (
            <ActivityIndicator color="#6C63FF" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
              <Text style={styles.emptyDesc}>
                {activeFilter
                  ? `Tidak ada transaksi dengan status "${statusLabels[activeFilter]}"`
                  : 'Transaksi akan muncul setelah pelanggan scan QRIS Anda'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#12122A',
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  filterChipActive: { backgroundColor: '#6C63FF20', borderColor: '#6C63FF' },
  filterText: { color: '#9CA3AF', fontSize: 13 },
  filterTextActive: { color: '#6C63FF', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { flex: 1 },
  txItem: {
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
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txAmount: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  txStore: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  txDate: { fontSize: 11, color: '#6B7280' },
  txRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  feeText: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
