import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTransactionStore } from '../../stores/transactionStore';
import { formatRupiah, formatDate, statusColors, statusLabels } from '../../utils/formatters';

export default function TransactionDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { selectedTransaction, isLoading, loadTransactionById } = useTransactionStore();

  useEffect(() => {
    loadTransactionById(id);
  }, [id]);

  const handleShare = async () => {
    if (!selectedTransaction) return;
    try {
      await Share.share({
        message: `Bukti Pembayaran BukuPay\nToko: ${selectedTransaction.store?.name}\nJumlah: ${formatRupiah(selectedTransaction.amount)}\nWaktu: ${formatDate(selectedTransaction.paidAt)}\nNo. Ref: ${selectedTransaction.referenceNo || '-'}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!selectedTransaction) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Transaksi tidak ditemukan</Text>
      </View>
    );
  }

  const tx = selectedTransaction;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Detail Transaksi</Text>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[tx.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[tx.status] }]}>
            {statusLabels[tx.status]}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Jumlah Pembayaran</Text>
        <Text style={styles.amountValue}>{formatRupiah(tx.amount)}</Text>
        {tx.fee > 0 && (
          <Text style={styles.feeText}>MDR: -{formatRupiah(tx.fee)}</Text>
        )}
        <Text style={styles.netAmount}>
          Diterima bersih: {formatRupiah(tx.netAmount)}
        </Text>
      </View>

      {/* Detail Info */}
      <View style={styles.detailCard}>
        <DetailRow label="Toko" value={tx.store?.name} />
        <DetailRow label="Waktu Bayar" value={formatDate(tx.paidAt || tx.createdAt)} />
        <DetailRow label="No. Referensi" value={tx.referenceNo || '-'} mono />
        <DetailRow label="Transaction ID" value={tx.id.slice(0, 8) + '...'} mono />
        {tx.xenditId && <DetailRow label="Xendit ID" value={tx.xenditId.slice(0, 12) + '...'} mono />}
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>📤 Bagikan Bukti Pembayaran</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.monoText]}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  content: { padding: 20, paddingBottom: 40 },
  loading: { flex: 1, backgroundColor: '#0A0A1A', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },
  backButton: { marginTop: 60, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { color: '#6C63FF', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  statusContainer: { marginBottom: 20 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontWeight: '700', fontSize: 14 },
  amountCard: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  amountLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  amountValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  feeText: { color: '#EF4444', fontSize: 13, marginTop: 4 },
  netAmount: { color: '#10B981', fontSize: 15, fontWeight: '600', marginTop: 8 },
  detailCard: {
    backgroundColor: '#12122A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3F',
  },
  detailLabel: { color: '#9CA3AF', fontSize: 13 },
  detailValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  monoText: { fontFamily: 'monospace', fontSize: 12 },
  shareButton: {
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
});
