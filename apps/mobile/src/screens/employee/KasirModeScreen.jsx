import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMerchantStore } from '../../stores/merchantStore';
import { apiService } from '../../api/services';

/**
 * KasirModeScreen — tampilan minimalis untuk karyawan kasir
 * Login dengan PIN 6 digit, hanya bisa lihat QR code
 */
export default function KasirModeScreen() {
  const navigation = useNavigation();
  const { activeStore } = useMerchantStore();
  const [phase, setPhase] = useState('pin'); // 'pin' | 'qr'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [kasirInfo, setKasirInfo] = useState(null);
  const [now, setNow] = useState(new Date());

  // Update jam setiap menit
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePinLogin = async () => {
    if (!phone || !pin || pin.length < 6) return;
    if (!activeStore) {
      Alert.alert('Error', 'Pilih toko aktif terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.employee.pinLogin({
        storeId: activeStore.id,
        phone,
        pin,
      });
      setKasirInfo(res.data);
      setPhase('qr');
    } catch (err) {
      const msg = err.message;
      if (msg === 'PIN_INVALID') Alert.alert('PIN Salah', 'Pastikan PIN 6 digit yang Anda masukkan benar.');
      else if (msg === 'PIN_NOT_SET') Alert.alert('PIN Belum Diatur', 'Hubungi pemilik toko untuk mengatur PIN Anda.');
      else if (msg === 'EMPLOYEE_NOT_FOUND') Alert.alert('Tidak Terdaftar', 'Nomor HP ini tidak terdaftar sebagai kasir di toko ini.');
      else Alert.alert('Error', msg || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar Mode Kasir', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => { setPhase('pin'); setPin(''); setKasirInfo(null); } },
    ]);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ─── QR Display (setelah login berhasil) ───────────────────────────────────
  if (phase === 'qr') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

        {/* Header */}
        <View style={styles.qrHeader}>
          <View>
            <Text style={styles.qrStoreName}>{kasirInfo?.employee?.store?.name || activeStore?.name}</Text>
            <Text style={styles.qrKasirName}>👤 Mode Kasir</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* Clock */}
        <View style={styles.clockSection}>
          <Text style={styles.clockTime}>{formatTime(now)}</Text>
          <Text style={styles.clockDate}>{formatDate(now)}</Text>
        </View>

        {/* QR Code Area */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>Scan untuk Bayar</Text>

          {/* QR Code Display */}
          {activeStore?.qrisImageUrl ? (
            <View style={styles.qrImageContainer}>
              {/* QR Image — gunakan Image component di implementasi nyata */}
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderIcon}>📱</Text>
                <Text style={styles.qrPlaceholderText}>QRIS Code</Text>
                <Text style={styles.qrPlaceholderSub}>{activeStore?.name}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.qrNoCode}>
              <Text style={styles.qrNoCodeIcon}>⚠️</Text>
              <Text style={styles.qrNoCodeText}>QRIS belum diaktifkan</Text>
              <Text style={styles.qrNoCodeSub}>Hubungi pemilik toko</Text>
            </View>
          )}

          <Text style={styles.qrInstruction}>
            Arahkan kamera HP pembeli ke QR di atas
          </Text>
          <View style={styles.qrisBadge}>
            <Text style={styles.qrisBadgeText}>QRIS</Text>
          </View>
        </View>

        {/* Bottom info */}
        <View style={styles.infoBar}>
          <Text style={styles.infoBarText}>⚡ Pembayaran langsung masuk ke rekening pemilik toko</Text>
        </View>

        {/* Restricted permissions notice */}
        <View style={styles.restrictedNotice}>
          <Text style={styles.restrictedText}>
            🔒 Mode kasir — laporan & pengaturan tidak dapat diakses
          </Text>
        </View>
      </View>
    );
  }

  // ─── PIN Login ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      <View style={styles.pinContent}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.pinIconWrap}>
          <Text style={styles.pinIcon}>🏪</Text>
        </View>

        <Text style={styles.pinTitle}>Mode Kasir</Text>
        <Text style={styles.pinSubtitle}>
          Login untuk menampilkan QR code toko{'\n'}
          {activeStore ? `📍 ${activeStore.name}` : ''}
        </Text>

        {/* Phone */}
        <Text style={styles.inputLabel}>Nomor HP</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇮🇩 +62</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="81234567890"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            style={styles.phoneInput}
            returnKeyType="next"
          />
        </View>

        {/* PIN */}
        <Text style={styles.inputLabel}>PIN Kasir (6 digit)</Text>
        <TextInput
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          style={styles.pinInput}
          returnKeyType="done"
          onSubmitEditing={handlePinLogin}
        />

        {/* PIN dots visualizer */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, (loading || !phone || pin.length < 6) && styles.loginBtnDisabled]}
          onPress={handlePinLogin}
          disabled={loading || !phone || pin.length < 6}
        >
          <Text style={styles.loginBtnText}>
            {loading ? 'Memverifikasi...' : '🔓 Masuk Mode Kasir'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.pinHelpText}>
          Belum punya PIN? Minta pemilik toko untuk mengaturkan PIN Anda.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },

  // QR Mode styles
  qrHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40,
    borderBottomWidth: 1, borderBottomColor: '#1E1E3F',
  },
  qrStoreName: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  qrKasirName: { color: '#6C63FF', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  clockSection: { alignItems: 'center', paddingVertical: 24 },
  clockTime: { fontSize: 56, fontWeight: '800', color: '#FFF', letterSpacing: -2 },
  clockDate: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  qrCard: {
    backgroundColor: '#12122A', borderRadius: 24, margin: 20,
    padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#6C63FF30',
    shadowColor: '#6C63FF', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  qrLabel: { color: '#9CA3AF', fontSize: 14, marginBottom: 20, fontWeight: '600' },
  qrImageContainer: { width: 240, height: 240, marginBottom: 20 },
  qrPlaceholder: {
    width: 240, height: 240,
    backgroundColor: '#FFF', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  qrPlaceholderIcon: { fontSize: 56, marginBottom: 8 },
  qrPlaceholderText: { fontSize: 16, fontWeight: '700', color: '#0A0A1A' },
  qrPlaceholderSub: { fontSize: 12, color: '#6B7280' },
  qrNoCode: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1E3F', borderRadius: 16 },
  qrNoCodeIcon: { fontSize: 40, marginBottom: 12 },
  qrNoCodeText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  qrNoCodeSub: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  qrInstruction: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  qrisBadge: { backgroundColor: '#6C63FF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  qrisBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  infoBar: { backgroundColor: '#10B98115', borderWidth: 1, borderColor: '#10B98130', borderRadius: 12, marginHorizontal: 20, padding: 12 },
  infoBarText: { color: '#10B981', fontSize: 12, textAlign: 'center' },
  restrictedNotice: { padding: 16, alignItems: 'center' },
  restrictedText: { color: '#6B7280', fontSize: 11, textAlign: 'center' },

  // PIN Login styles
  pinContent: { flex: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 56 : 40 },
  backBtn: { marginBottom: 24 },
  backBtnText: { color: '#6C63FF', fontSize: 16 },
  pinIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pinIcon: { fontSize: 36 },
  pinTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  pinSubtitle: { color: '#9CA3AF', fontSize: 14, lineHeight: 22, marginBottom: 32 },
  inputLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', marginBottom: 20 },
  countryCode: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, marginRight: 8, justifyContent: 'center' },
  countryCodeText: { color: '#FFF', fontSize: 14 },
  phoneInput: { flex: 1, backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', fontSize: 16 },
  pinInput: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#FFF', fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 12 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
  pinDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#1E1E3F', backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  loginBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  pinHelpText: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
