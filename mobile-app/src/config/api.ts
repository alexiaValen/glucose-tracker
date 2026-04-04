// src/config/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { authEvents, AUTH_LOGOUT_EVENT } from './authEvents';

// Read from EAS / .env
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Fail fast if missing (prevents "silently calls localhost")
if (!API_URL) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_URL. Set it in mobile-app/eas.json (production env) or mobile-app/.env (local dev).'
  );
}

export const API_BASE_URL = API_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — reads from SecureStore (same place authService writes)
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📍 Full URL:', `${config.baseURL}${config.url}`);
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');

      // 🔥 DEBUG (THIS IS WHAT WE NEED)
      console.log('🔐 TOKEN FROM STORE:', token);

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ AUTH HEADER SET');
      } else {
        console.log('❌ NO TOKEN FOUND');
      }

      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📍 Full URL:', `${config.baseURL}${config.url}`);
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Helper functions ─────────────────────────────────────────────────────────

export const setAuthToken = async (token: string | null) => {
  try {
    if (token) {
      await SecureStore.setItemAsync('accessToken', token);
      console.log('✅ Auth token saved');
    } else {
      await SecureStore.deleteItemAsync('accessToken');
      console.log('🗑️ Auth token removed');
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const clearAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    console.log('🗑️ Auth tokens cleared');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export default api;