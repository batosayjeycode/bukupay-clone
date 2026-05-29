import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import TransactionListScreen from '../screens/transaction/TransactionListScreen';
import TransactionDetailScreen from '../screens/transaction/TransactionDetailScreen';
import SettlementScreen from '../screens/settlement/SettlementScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TxStack = createNativeStackNavigator();

// Tab icon component
function TabIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// Home Stack
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
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

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
        component={SettlementScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💰" label="Pencairan" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
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
