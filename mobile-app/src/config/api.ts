// mobile-app/src/config/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const ACCESS_TOKEN_KEY = 'accessToken';

// Get token from SecureStore
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Set token (called by auth.service.ts)
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Clear token (called by auth.service.ts)
export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

// Add auth token to all requests (EXCEPT auth endpoints)
api.interceptors.request.use(
  async (config) => {
    // ✅ FIX: Skip token for auth endpoints
    const isAuthEndpoint = 
      config.url?.includes('/auth/login') || 
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password');

    // Only add token for non-auth endpoints
    if (!isAuthEndpoint) {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = 
        url.includes('/auth/login') || 
        url.includes('/auth/register');

      // Only log error if NOT an auth endpoint (auth endpoints can fail normally)
      if (!isAuthEndpoint) {
        console.error('❌ 401 Unauthorized - Token may be invalid or expired');
        console.error('Request URL:', url);
        console.error('Token exists:', !!(await getAuthToken()));
        
        // Clear invalid token
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        clearAuthToken();
      } else {
        // Auth endpoint failure (wrong credentials) - this is normal
        console.log('🔐 Authentication failed - check credentials');
      }
    }
    return Promise.reject(error);
  }
);