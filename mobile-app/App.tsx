// App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { authEvents, AUTH_LOGOUT_EVENT } from './src/config/authEvents';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  useEffect(() => {
    const handler = () => {
      // Called when refresh token fails — clears zustand, navigator reacts to isAuthenticated: false
      useAuthStore.getState().logout();
    };

    authEvents.on(AUTH_LOGOUT_EVENT, handler);
    return () => { authEvents.off(AUTH_LOGOUT_EVENT, handler); };
  }, []);

  return <AppNavigator />;
}