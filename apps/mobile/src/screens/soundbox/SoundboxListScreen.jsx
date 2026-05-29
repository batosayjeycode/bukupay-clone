import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../api/services';

export default function SoundboxListScreen() {
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiService.soundbox.getDevices();
      setDevices(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleTest = async (device) => {
    if (!device.isOnline) {
      Alert.alert('Offline', 'Perangkat sedang tidak terhubung');
      return;
    }
    setTestingId(device.id);
    try {
      await apiService.soundbox.testSound(device.id);
      Alert.alert('✅ Berhasil', 'Test suara dikirim ke perangkat!');
    } catch {
      Alert.alert('Error', 'Gagal mengirim test suara');
    } finally {
      setTestingId(null);
    }
  };

  const renderItem = ({ item: device }) => (
    <View style={[styles.card, device.isOnline && styles.cardOnline]}>
      <View style={styles.cardTop}>
        <View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: device.isOnline ? '#10B981' : '#6B7280' }]} />
            <Text style={[styles.statusText, { color: device.isOnline ? '#10B981' : '#6B7280' }]}>
              {device.isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.storeName}>📍 {device.store?.name}</Text>
        </View>
        <Text style={styles.deviceIcon}>🔊</Text>
      </View>

      <View style={styles.deviceMeta}>
        <Text style={styles.metaText}>🔉 Volume: {device.volume}%</Text>
        <Text style={styles.metaText}>⚡ Firmware: v{device.firmwareVer || '—'}</Text>
        {device.lastSeenAt && (
          <Text style={styles.metaText}>
            🕐 Aktif: {new Date(device.lastSeenAt).toLocaleString('id-ID')}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.testBtn, !device.isOnline && styles.testBtnDisabled]}
          onPress={() => handleTest(device)}
          disabled={!device.isOnline || testingId === device.id}
        >
          <Text style={styles.testBtnText}>
            {testingId === device.id ? '⏳ Testing...' : '🔔 Test Suara'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Soundbox</Text>
          <Text style={styles.subtitle}>
            {devices.filter((d) => d.isOnline).length}/{devices.length} perangkat online
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('SoundboxPair')}>
          <Text style={styles.addBtnText}>+ Pasang</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔇</Text>
            <Text style={styles.emptyText}>Belum ada soundbox</Text>
            <Text style={styles.emptySub}>Tap "+ Pasang" untuk menghubungkan perangkat</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1E1E3F' },
  back: { color: '#6C63FF', fontSize: 24, marginRight: 16 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#9CA3AF', fontSize: 13 },
  addBtn: { marginLeft: 'auto', backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardOnline: { borderColor: '#10B98140' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  deviceName: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  storeName: { color: '#9CA3AF', fontSize: 13 },
  deviceIcon: { fontSize: 40 },
  deviceMeta: { borderTopWidth: 1, borderTopColor: '#1E1E3F', paddingTop: 12, marginBottom: 12 },
  metaText: { color: '#6B7280', fontSize: 13, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  testBtn: { flex: 1, backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B981', borderRadius: 12, padding: 12, alignItems: 'center' },
  testBtnDisabled: { backgroundColor: '#1A1A35', borderColor: '#1E1E3F' },
  testBtnText: { color: '#10B981', fontWeight: '700', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#6B7280', fontSize: 13 },
});
