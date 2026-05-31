import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMerchantStore } from '../../stores/merchantStore';
import { apiService } from '../../api/services';

/**
 * SoundboxPairScreen — pairing soundbox white-label via Device ID
 *
 * Flow:
 * 1. Merchant tap tombol "+" di SoundboxListScreen
 * 2. Input Device ID (MAC address dari sticker di belakang perangkat)
 *    ATAU: input manual (karena white-label device tidak punya QR scanner built-in)
 * 3. Input nama device (contoh: "Kasir Depan")
 * 4. POST /api/soundbox/register → terima MQTT credentials
 * 5. Tampilkan success + instruksi konfigurasi perangkat
 *
 * Note: White-label device dikonfigurasi via web admin panel bawaan device
 * (buka http://192.168.4.1 saat device dalam mode AP), masukkan MQTT credentials
 */
export default function SoundboxPairScreen() {
  const navigation = useNavigation();
  const { activeStore, stores } = useMerchantStore();
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(activeStore?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // credentials setelah pairing berhasil

  const handlePair = async () => {
    const cleanDeviceId = deviceId.toUpperCase().trim().replace(/[^A-F0-9:]/g, '');
    if (!cleanDeviceId || cleanDeviceId.length < 12) {
      Alert.alert('Device ID Tidak Valid', 'Masukkan MAC address perangkat (contoh: AA:BB:CC:DD:EE:FF)');
      return;
    }
    if (!deviceName.trim()) {
      Alert.alert('Nama Diperlukan', 'Beri nama perangkat ini (contoh: Kasir Depan)');
      return;
    }
    if (!selectedStoreId) {
      Alert.alert('Pilih Toko', 'Pilih toko untuk perangkat ini');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.soundbox.register({
        storeId: selectedStoreId,
        deviceId: cleanDeviceId,
        name: deviceName.trim(),
      });
      setResult(res.data);
    } catch (err) {
      const msg = err.message;
      if (msg === 'DEVICE_ALREADY_PAIRED') {
        Alert.alert('Sudah Terpasang', 'Perangkat ini sudah terdaftar di toko lain. Hapus terlebih dahulu.');
      } else if (msg === 'STORE_NOT_FOUND') {
        Alert.alert('Toko Tidak Ditemukan', 'Pastikan Anda memiliki akses ke toko ini.');
      } else {
        Alert.alert('Gagal Memasangkan', msg || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Success screen setelah pairing ───────────────────────────────────────
  if (result) {
    const { mqttCredentials } = result;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

        <View style={styles.successIcon}>
          <Text style={{ fontSize: 56 }}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>Soundbox Terhubung!</Text>
        <Text style={styles.successSubtitle}>
          Perangkat berhasil didaftarkan. Sekarang konfigurasikan perangkat menggunakan informasi berikut.
        </Text>

        {/* MQTT Credentials Card */}
        <View style={styles.credCard}>
          <Text style={styles.credTitle}>⚙️ Konfigurasi Perangkat</Text>
          <Text style={styles.credHint}>
            Buka halaman admin perangkat (http://192.168.4.1 saat device dalam AP mode), lalu masukkan data berikut:
          </Text>

          {[
            { label: 'MQTT Broker', value: mqttCredentials?.brokerUrl || process.env.MQTT_BROKER_URL || 'mqtt://broker.bukupay.id:1883' },
            { label: 'Username', value: mqttCredentials?.username },
            { label: 'Password', value: mqttCredentials?.password },
            { label: 'Topic', value: mqttCredentials?.topic },
          ].map(({ label, value }) => (
            <View key={label} style={styles.credRow}>
              <Text style={styles.credLabel}>{label}</Text>
              <Text style={styles.credValue} selectable>{value || '—'}</Text>
            </View>
          ))}

          <View style={styles.credWarning}>
            <Text style={styles.credWarningText}>
              ⚠️ Simpan credentials ini. Password tidak bisa ditampilkan lagi setelah layar ini ditutup.
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📋 Langkah Selanjutnya</Text>
          {[
            'Nyalakan perangkat soundbox',
            'Hubungkan HP ke WiFi perangkat (AP mode)',
            'Buka browser → http://192.168.4.1',
            'Masukkan WiFi rumah/toko + MQTT credentials di atas',
            'Simpan & restart perangkat',
            'Perangkat akan muncul Online dalam 30 detik',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('SoundboxList')}
        >
          <Text style={styles.doneBtnText}>✅ Selesai — Lihat Perangkat</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Pairing form ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconWrap}>
        <Text style={{ fontSize: 48 }}>🔊</Text>
      </View>
      <Text style={styles.formTitle}>Pasang Soundbox</Text>
      <Text style={styles.formSubtitle}>
        Daftarkan perangkat soundbox white-label Anda ke toko BukuPay
      </Text>

      {/* Device ID input */}
      <Text style={styles.label}>Device ID (MAC Address)</Text>
      <View style={styles.macInputWrap}>
        <TextInput
          value={deviceId}
          onChangeText={(t) => setDeviceId(t.toUpperCase())}
          placeholder="AA:BB:CC:DD:EE:FF"
          placeholderTextColor="#6B7280"
          autoCapitalize="characters"
          style={styles.macInput}
        />
      </View>
      <Text style={styles.hint}>📍 Lihat sticker di bagian bawah perangkat</Text>

      {/* Device name */}
      <Text style={[styles.label, { marginTop: 20 }]}>Nama Perangkat</Text>
      <TextInput
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder="contoh: Kasir Depan, Meja 1"
        placeholderTextColor="#6B7280"
        style={styles.nameInput}
        maxLength={30}
      />

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <>
          <Text style={[styles.label, { marginTop: 20 }]}>Toko</Text>
          <View style={styles.storeSelector}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[styles.storeChip, selectedStoreId === store.id && styles.storeChipActive]}
                onPress={() => setSelectedStoreId(store.id)}
              >
                <Text style={[styles.storeChipText, selectedStoreId === store.id && styles.storeChipTextActive]}>
                  {store.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>ℹ️ Tentang White-label Soundbox</Text>
        <Text style={styles.infoBoxText}>
          Perangkat soundbox BukuPay adalah speaker pintar yang akan berbunyi setiap kali ada pembayaran masuk via QRIS. Konfigurasi dilakukan melalui halaman web perangkat.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.pairBtn, (loading || !deviceId || !deviceName) && styles.pairBtnDisabled]}
        onPress={handlePair}
        disabled={loading || !deviceId || !deviceName}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.pairBtnText}>🔗 Daftarkan Perangkat</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  formContent: { padding: 24, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },
  successContent: { padding: 24, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40, alignItems: 'center' },

  header: { marginBottom: 24 },
  back: { color: '#6C63FF', fontSize: 16 },
  iconWrap: { width: 88, height: 88, borderRadius: 24, backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  formTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  formSubtitle: { color: '#9CA3AF', fontSize: 14, lineHeight: 22, marginBottom: 28 },

  label: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  macInputWrap: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 2, marginBottom: 6 },
  macInput: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 2, paddingVertical: 14 },
  hint: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  nameInput: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#FFF', fontSize: 15 },
  storeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  storeChip: { borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#12122A' },
  storeChipActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF20' },
  storeChipText: { color: '#9CA3AF', fontSize: 13 },
  storeChipTextActive: { color: '#6C63FF', fontWeight: '700' },
  infoBox: { backgroundColor: '#6C63FF10', borderWidth: 1, borderColor: '#6C63FF30', borderRadius: 14, padding: 16, marginTop: 20, marginBottom: 24 },
  infoBoxTitle: { color: '#A78BFA', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  infoBoxText: { color: '#9CA3AF', fontSize: 13, lineHeight: 20 },
  pairBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' },
  pairBtnDisabled: { opacity: 0.5 },
  pairBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Success styles
  successIcon: { width: 100, height: 100, borderRadius: 28, backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B98140', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  successSubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  credCard: { width: '100%', backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 16, padding: 20, marginBottom: 16 },
  credTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  credHint: { color: '#9CA3AF', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  credRow: { backgroundColor: '#0A0A1A', borderRadius: 10, padding: 12, marginBottom: 8 },
  credLabel: { color: '#6B7280', fontSize: 11, marginBottom: 4, fontWeight: '600' },
  credValue: { color: '#FFF', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600' },
  credWarning: { backgroundColor: '#F59E0B15', borderWidth: 1, borderColor: '#F59E0B40', borderRadius: 10, padding: 12, marginTop: 8 },
  credWarningText: { color: '#F59E0B', fontSize: 12, lineHeight: 18 },
  instructionCard: { width: '100%', backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 16, padding: 20, marginBottom: 20 },
  instructionTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 },
  stepNumText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  stepText: { color: '#D1D5DB', fontSize: 13, flex: 1, lineHeight: 20 },
  doneBtn: { width: '100%', backgroundColor: '#10B981', borderRadius: 14, padding: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
