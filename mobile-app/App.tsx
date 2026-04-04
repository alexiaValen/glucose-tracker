// App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { authEvents, AUTH_LOGOUT_EVENT } from './src/config/authEvents';
import { useAuthStore } from './src/stores/authStore';
import * as SecureStore from 'expo-secure-store';

export default function App() {
  useEffect(() => {
    const handler = () => {
      useAuthStore.getState().logout();
    };

    authEvents.on(AUTH_LOGOUT_EVENT, handler);
    return () => { authEvents.off(AUTH_LOGOUT_EVENT, handler); };
  }, []);

  // 👇 ADD THIS BLOCK
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      console.log('🧪 MANUAL TOKEN CHECK:', token);
    };

    checkToken();
  }, []);

  return <AppNavigator />;
}