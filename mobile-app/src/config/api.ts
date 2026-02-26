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
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    return response;
  },
  async (error) => {
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'GET';

    if (error.response) {
      console.error(`❌ ${error.response.status} ${method} ${url}`);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error(`❌ Network Error ${method} ${url}`);
      console.error('Request was made but no response received');
      console.error('Is backend running at:', `${error.config.baseURL}${url}`);
    } else {
      console.error(`❌ ${method} ${url}:`, error.message);
    }

    // Handle 401 — attempt token refresh once
    if (error.response?.status === 401 && !error.config?._retry) {
      error.config._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = refreshRes.data;

        await SecureStore.setItemAsync('accessToken', accessToken);

        error.config.headers = error.config.headers ?? {};
        error.config.headers.Authorization = `Bearer ${accessToken}`;

        return api(error.config);
      } catch (refreshError) {
        console.error('Token refresh failed — forcing logout:', refreshError);
        await clearAuthToken();
        authEvents.emit(AUTH_LOGOUT_EVENT);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
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