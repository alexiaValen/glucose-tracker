// App.tsx
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { authEvents, AUTH_LOGOUT_EVENT } from './src/config/authEvents';
import { useAuthStore } from './src/stores/authStore';

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

  return <AppNavigator />;
}