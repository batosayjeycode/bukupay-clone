import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { notificationApi } from './api/services';
import { useAuthStore } from './stores/authStore';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Request FCM permission
    async function setupFCM() {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          if (token) {
            await notificationApi.registerToken(token, 'android');
          }
        }
      } catch (err) {
        console.error('FCM setup error:', err);
      }
    }

    setupFCM();

    // Foreground message handler
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.info('FCM message received:', remoteMessage.notification?.title);
      // TODO: Tampilkan in-app notification modal
    });

    return unsubscribe;
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
