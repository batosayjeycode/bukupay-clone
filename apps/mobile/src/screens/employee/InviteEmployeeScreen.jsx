import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../api/services';

export default function InviteEmployeeScreen({ route }) {
  const navigation = useNavigation();
  const { storeId, storeName } = route.params || {};
  const [phone, setPhone] = useState('');
  const [permissions, setPermissions] = useState({
    canRefund: false,
    canViewReport: false,
    canManageEmployees: false,
  });
  const [loading, setLoading] = useState(false);

  const togglePerm = (key) => setPermissions((p) => ({ ...p, [key]: !p[key] }));

  const handleInvite = async () => {
    if (!phone || phone.length < 9) {
      Alert.alert('Validasi', 'Masukkan nomor HP yang valid');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.employee.invite({ storeId, phone, permissions });
      const { inviteUrl, whatsappSent } = res.data;
      Alert.alert(
        'Undangan Terkirim! 🎉',
        whatsappSent
          ? 'Link undangan sudah dikirim via WhatsApp.'
          : `Link undangan:\n${inviteUrl}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err.message || 'Gagal mengirim undangan';
      Alert.alert('Error', msg === 'ALREADY_EMPLOYEE' ? 'Pengguna sudah menjadi karyawan di toko ini' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Undang Karyawan</Text>
          <Text style={styles.subtitle}>{storeName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nomor HP Karyawan</Text>
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
          />
        </View>

        <Text style={styles.sectionTitle}>Hak Akses Kasir</Text>
        <Text style={styles.sectionSubtitle}>Pilih apa saja yang boleh dilakukan karyawan ini</Text>

        {[
          { key: 'canRefund', icon: '↩️', label: 'Refund Transaksi', desc: 'Bisa membatalkan dan refund pembayaran' },
          { key: 'canViewReport', icon: '📊', label: 'Lihat Laporan', desc: 'Bisa melihat laporan pendapatan harian' },
          { key: 'canManageEmployees', icon: '👥', label: 'Kelola Karyawan', desc: 'Bisa mengundang/menghapus karyawan lain' },
        ].map(({ key, icon, label, desc }) => (
          <TouchableOpacity key={key} style={[styles.permCard, permissions[key] && styles.permCardActive]} onPress={() => togglePerm(key)}>
            <View style={styles.permLeft}>
              <Text style={styles.permIcon}>{icon}</Text>
              <View>
                <Text style={styles.permLabel}>{label}</Text>
                <Text style={styles.permDesc}>{desc}</Text>
              </View>
            </View>
            <View style={[styles.checkbox, permissions[key] && styles.checkboxActive]}>
              {permissions[key] && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Karyawan akan login dengan PIN 6 digit (bukan OTP), dan hanya bisa melihat QR code toko.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (loading || !phone) && styles.submitBtnDisabled]}
          onPress={handleInvite}
          disabled={loading || !phone}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Mengirim...' : '📨 Kirim Undangan via WhatsApp'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1E1E3F' },
  back: { color: '#6C63FF', fontSize: 24, marginRight: 16 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#9CA3AF', fontSize: 13 },
  content: { padding: 20 },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', marginBottom: 28 },
  countryCode: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginRight: 8 },
  countryCodeText: { color: '#FFF', fontSize: 14 },
  phoneInput: { flex: 1, backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', fontSize: 16 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { color: '#6B7280', fontSize: 13, marginBottom: 16 },
  permCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 14, padding: 16, marginBottom: 10 },
  permCardActive: { borderColor: '#6C63FF40', backgroundColor: '#6C63FF10' },
  permLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  permIcon: { fontSize: 24, marginRight: 12 },
  permLabel: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  permDesc: { color: '#6B7280', fontSize: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#1E1E3F', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  infoBox: { backgroundColor: '#6C63FF15', borderWidth: 1, borderColor: '#6C63FF40', borderRadius: 12, padding: 14, marginVertical: 16 },
  infoText: { color: '#A78BFA', fontSize: 13, lineHeight: 20 },
  submitBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
