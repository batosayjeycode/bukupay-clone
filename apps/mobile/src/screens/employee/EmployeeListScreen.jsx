import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../api/services';

export default function EmployeeListScreen({ route }) {
  const navigation = useNavigation();
  const { storeId, storeName } = route.params || {};
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiService.employee.list(storeId);
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [storeId]);

  const handleRemove = (employee) => {
    Alert.alert(
      'Hapus Karyawan',
      `Apakah Anda yakin ingin menghapus karyawan dengan ID ${employee.id}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            try {
              await apiService.employee.remove(employee.id);
              load();
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus karyawan');
            }
          },
        },
      ]
    );
  };

  const handleTogglePermission = async (employee, key) => {
    const currentPerms = employee.permissions || {};
    const newPerms = { ...currentPerms, [key]: !currentPerms[key] };
    try {
      await apiService.employee.updatePermissions(employee.id, newPerms);
      setEmployees((prev) =>
        prev.map((e) => e.id === employee.id ? { ...e, permissions: newPerms } : e)
      );
    } catch {
      Alert.alert('Error', 'Gagal mengubah permission');
    }
  };

  const renderItem = ({ item: emp }) => {
    const perms = emp.permissions || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{emp.userId?.slice(-8) || '—'}</Text>
            <Text style={styles.role}>Kasir</Text>
            {emp.joinedAt && (
              <Text style={styles.joined}>
                Bergabung {new Date(emp.joinedAt).toLocaleDateString('id-ID')}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(emp)}>
            <Text style={styles.removeBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.permissionsSection}>
          <Text style={styles.permsTitle}>Permissions</Text>
          {[
            { key: 'canRefund', label: 'Refund Transaksi' },
            { key: 'canViewReport', label: 'Lihat Laporan' },
            { key: 'canManageEmployees', label: 'Kelola Karyawan' },
          ].map(({ key, label }) => (
            <View key={key} style={styles.permRow}>
              <Text style={styles.permLabel}>{label}</Text>
              <Switch
                value={!!perms[key]}
                onValueChange={() => handleTogglePermission(emp, key)}
                trackColor={{ false: '#1E1E3F', true: '#6C63FF60' }}
                thumbColor={perms[key] ? '#6C63FF' : '#6B7280'}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Karyawan</Text>
          <Text style={styles.subtitle}>{storeName}</Text>
        </View>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => navigation.navigate('InviteEmployee', { storeId, storeName })}
        >
          <Text style={styles.inviteBtnText}>+ Undang</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6C63FF" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Belum ada karyawan</Text>
            <Text style={styles.emptySubtext}>Undang kasir untuk membantu kelola toko Anda</Text>
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
  inviteBtn: { marginLeft: 'auto', backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  inviteBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#12122A', borderWidth: 1, borderColor: '#1E1E3F', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A35', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  role: { color: '#6C63FF', fontSize: 12, marginTop: 2 },
  joined: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 18 },
  permissionsSection: { borderTopWidth: 1, borderTopColor: '#1E1E3F', paddingTop: 12 },
  permsTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  permLabel: { color: '#D1D5DB', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { color: '#6B7280', fontSize: 13, textAlign: 'center' },
});
