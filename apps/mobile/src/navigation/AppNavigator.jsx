import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens — Phase 1
import HomeScreen from '../screens/home/HomeScreen';
import TransactionListScreen from '../screens/transaction/TransactionListScreen';
import TransactionDetailScreen from '../screens/transaction/TransactionDetailScreen';
import SettlementScreen from '../screens/settlement/SettlementScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Screens — Phase 2
import EmployeeListScreen from '../screens/employee/EmployeeListScreen';
import InviteEmployeeScreen from '../screens/employee/InviteEmployeeScreen';
import KasirModeScreen from '../screens/employee/KasirModeScreen';
import SoundboxListScreen from '../screens/soundbox/SoundboxListScreen';
import SoundboxPairScreen from '../screens/soundbox/SoundboxPairScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TxStack = createNativeStackNavigator();
const SettleStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Tab icon component
function TabIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// Home Stack — tambah Phase 2 screens
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      {/* Phase 2 */}
      <HomeStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <HomeStack.Screen name="InviteEmployee" component={InviteEmployeeScreen} />
      <HomeStack.Screen name="KasirMode" component={KasirModeScreen} />
      <HomeStack.Screen name="SoundboxList" component={SoundboxListScreen} />
      <HomeStack.Screen name="SoundboxPair" component={SoundboxPairScreen} />
    </HomeStack.Navigator>
  );
}

// Transaction Stack
function TransactionStackNavigator() {
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TransactionList" component={TransactionListScreen} />
      <TxStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </TxStack.Navigator>
  );
}

// Settlement Stack
function SettlementStackNavigator() {
  return (
    <SettleStack.Navigator screenOptions={{ headerShown: false }}>
      <SettleStack.Screen name="SettlementMain" component={SettlementScreen} />
    </SettleStack.Navigator>
  );
}

// Profile Stack
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          // iOS: tambah safe area bottom untuk notch devices
          Platform.OS === 'ios' && {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 4,
          },
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Beranda" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionTab"
        component={TransactionStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label="Transaksi" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SettlementTab"
        component={SettlementStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💰" label="Pencairan" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#12122A',
    borderTopColor: '#1E1E3F',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconTextActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});
