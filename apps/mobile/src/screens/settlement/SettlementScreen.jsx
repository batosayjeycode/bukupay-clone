import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { settlementApi } from '../../api/services';
import { formatRupiah, formatDate, statusColors, statusLabels } from '../../utils/formatters';
import { useMerchantStore } from '../../stores/merchantStore';

const INSTANT_FEE = 2500;
const INSTANT_MIN = 50000;

export default function SettlementScreen() {
  const { activeStore } = useMerchantStore();
  const [balance, setBalance] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [instantModal, setInstantModal] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);

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

  const handleInstantSettle = async () => {
    setInstantLoading(true);
    try {
      await settlementApi.requestInstant({ amount: balance.availableBalance });
      setInstantModal(false);
      Alert.alert(
        '⚡ Pencairan Diproses!',
        `Dana sebesar ${formatRupiah(balance.availableBalance - INSTANT_FEE)} sedang diproses. Estimasi masuk dalam 10 menit.`,
        [{ text: 'OK', onPress: () => fetchData() }]
      );
    } catch (err) {
      setInstantModal(false);
      const msg = err.message;
      if (msg === 'AMOUNT_TOO_SMALL') Alert.alert('Saldo Tidak Cukup', `Minimal ${formatRupiah(INSTANT_MIN)}`);
      else if (msg === 'INSUFFICIENT_BALANCE') Alert.alert('Saldo Tidak Cukup', 'Saldo tidak mencukupi termasuk biaya admin');
      else Alert.alert('Gagal', msg || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setInstantLoading(false);
    }
  };

  const canInstant = balance && balance.availableBalance >= INSTANT_MIN;

  const renderSettlement = ({ item }) => (
    <View style={styles.settlementItem}>
      <View style={styles.settleLeft}>
        <View style={[styles.settleIcon, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text>{item.status === 'COMPLETED' ? '✅' : item.status === 'FAILED' ? '❌' : '⏳'}</Text>
        </View>
        <View>
          <View style={styles.settleTopRow}>
            <Text style={styles.settleAmount}>{formatRupiah(item.amount)}</Text>
            {item.type === 'INSTANT' && (
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>⚡ Instan</Text>
              </View>
            )}
          </View>
          <Text style={styles.settleBank}>
            {item.bankCode} ••••{item.bankAccount?.slice(-4)}
          </Text>
          <Text style={styles.settleDate}>{formatDate(item.scheduledAt)}</Text>
          {item.fee > 0 && (
            <Text style={styles.settleFee}>Biaya admin: {formatRupiah(item.fee)}</Text>
          )}
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
                  <Text style={styles.detailValue}>{formatRupiah(balance?.totalEarned || 0)}</Text>
                </View>
                <View style={styles.balanceDetailItem}>
                  <Text style={styles.detailLabel}>Total Dicairkan</Text>
                  <Text style={styles.detailValue}>{formatRupiah(balance?.totalSettled || 0)}</Text>
                </View>
              </View>

              {/* ⚡ Phase 2: Instant Settlement Button */}
              {canInstant ? (
                <TouchableOpacity
                  style={styles.instantBtn}
                  onPress={() => setInstantModal(true)}
                >
                  <View>
                    <Text style={styles.instantBtnTitle}>⚡ Cairkan Sekarang</Text>
                    <Text style={styles.instantBtnSub}>
                      Terima dalam ~10 menit · Biaya {formatRupiah(INSTANT_FEE)}
                    </Text>
                  </View>
                  <Text style={styles.instantBtnArrow}>›</Text>
                </TouchableOpacity>
              ) : balance && balance.availableBalance > 0 ? (
                <View style={styles.instantDisabled}>
                  <Text style={styles.instantDisabledText}>
                    ⚡ Cairkan Sekarang — minimal saldo {formatRupiah(INSTANT_MIN)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>🕐</Text>
                <Text style={styles.scheduleText}>
                  Pencairan otomatis gratis: 10:00, 15:00, 20:00 WIB
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

      {/* ─── Instant Settlement Modal ──────────────────── */}
      <Modal
        visible={instantModal}
        transparent
        animationType="slide"
        onRequestClose={() => !instantLoading && setInstantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚡ Konfirmasi Pencairan Instan</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Saldo dicairkan</Text>
              <Text style={styles.modalValue}>{formatRupiah(balance?.availableBalance || 0)}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Biaya admin</Text>
              <Text style={[styles.modalValue, { color: '#EF4444' }]}>- {formatRupiah(INSTANT_FEE)}</Text>
            </View>
            <View style={[styles.modalRow, styles.modalTotalRow]}>
              <Text style={styles.modalTotalLabel}>Yang diterima</Text>
              <Text style={styles.modalTotalValue}>
                {formatRupiah((balance?.availableBalance || 0) - INSTANT_FEE)}
              </Text>
            </View>
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                💡 Dana akan masuk ke rekening utama Anda dalam 10 menit (jam kerja bank: 08:00–20:00 WIB)
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setInstantModal(false)}
                disabled={instantLoading}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, instantLoading && styles.modalConfirmBtnDisabled]}
                onPress={handleInstantSettle}
                disabled={instantLoading}
              >
                {instantLoading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalConfirmText}>⚡ Cairkan Sekarang</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  loading: { flex: 1, backgroundColor: '#0A0A1A', alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  balanceCard: { backgroundColor: '#12122A', borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#6C63FF40' },
  balanceLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  balanceDetails: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  balanceDetailItem: { flex: 1 },
  detailLabel: { color: '#6B7280', fontSize: 11, marginBottom: 4 },
  detailValue: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  instantBtn: { backgroundColor: '#6C63FF20', borderWidth: 1.5, borderColor: '#6C63FF', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  instantBtnTitle: { color: '#6C63FF', fontSize: 15, fontWeight: '800' },
  instantBtnSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  instantBtnArrow: { color: '#6C63FF', fontSize: 24, fontWeight: '300' },
  instantDisabled: { backgroundColor: '#1E1E3F', borderRadius: 12, padding: 12, marginBottom: 12 },
  instantDisabledText: { color: '#6B7280', fontSize: 12, textAlign: 'center' },
  scheduleInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E3F', borderRadius: 12, padding: 12, gap: 8 },
  scheduleIcon: { fontSize: 16 },
  scheduleText: { color: '#9CA3AF', fontSize: 12, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  settlementItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12122A', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1E1E3F' },
  settleLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  settleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  settleAmount: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  instantBadge: { backgroundColor: '#6C63FF20', borderWidth: 1, borderColor: '#6C63FF40', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  instantBadgeText: { color: '#6C63FF', fontSize: 10, fontWeight: '700' },
  settleBank: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  settleDate: { fontSize: 11, color: '#6B7280' },
  settleFee: { fontSize: 11, color: '#EF444480', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#12122A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 24 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalLabel: { color: '#9CA3AF', fontSize: 15 },
  modalValue: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalTotalRow: { borderTopWidth: 1, borderTopColor: '#1E1E3F', paddingTop: 14, marginTop: 4 },
  modalTotalLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalTotalValue: { color: '#10B981', fontSize: 20, fontWeight: '900' },
  modalInfo: { backgroundColor: '#6C63FF15', borderWidth: 1, borderColor: '#6C63FF30', borderRadius: 12, padding: 14, marginVertical: 20 },
  modalInfoText: { color: '#A78BFA', fontSize: 13, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#1A1A35', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 14, padding: 14, alignItems: 'center' },
  modalCancelText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, backgroundColor: '#6C63FF', borderRadius: 14, padding: 14, alignItems: 'center' },
  modalConfirmBtnDisabled: { opacity: 0.6 },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
