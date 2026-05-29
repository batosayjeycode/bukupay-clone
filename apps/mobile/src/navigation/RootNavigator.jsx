import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootNavigator() {
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // Jika sudah login tapi KYC belum verified → tetap di AuthNavigator (layar KYC)
  const showApp = isAuthenticated && user?.kycStatus === 'VERIFIED';

  return (
    <NavigationContainer>
      {showApp ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
