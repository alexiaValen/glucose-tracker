// mobile-app/src/config/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

// Add auth token to all requests
api.interceptors.request.use(
  async (config) => {
    // Get fresh token from SecureStore on each request
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
      console.error('Request URL:', error.config?.url);
      console.error('Token exists:', !!(await getAuthToken()));
    }
    return Promise.reject(error);
  }
);