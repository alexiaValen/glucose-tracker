// mobile-app/src/services/auth.service.ts
import { api, setAuthToken } from '../config/api';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    await this.saveTokens(response.data);
    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    await this.clearTokens();
  },

  async saveTokens(authData: AuthResponse): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authData.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authData.user));
    setAuthToken(authData.accessToken);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAuthToken(null);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getUser(): Promise<any | null> {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};