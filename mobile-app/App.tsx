// App.tsx
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { authEvents, AUTH_LOGOUT_EVENT } from './src/config/authEvents';
import { useAuthStore } from './src/stores/authStore';
import { healthKitService } from './src/services/healthkit.service';

export default function App() {
  useEffect(() => {
    const handler = () => {
      useAuthStore.getState().logout();
      Alert.alert(
        'Session Expired',
        'Please log in again to continue.',
        [{ text: 'OK' }]
      );
    };

    authEvents.on(AUTH_LOGOUT_EVENT, handler);
    return () => { authEvents.off(AUTH_LOGOUT_EVENT, handler); };
  }, []);

  // Restart HealthKit auto-sync on every app launch if previously enabled
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      const autoEnabled = await healthKitService.getAutoSyncEnabled();
      if (!autoEnabled) return;
      const initialized = await healthKitService.initialize();
      if (initialized) healthKitService.startAutoSync(15);
    })();
  }, []);

  return <AppNavigator />;
}