// mobile-app/src/stores/authStore.ts
import { create } from 'zustand';
import { User } from '../types/auth';
import { authService } from '../services/auth.service';
import { clearAuthToken } from '../config/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    phone?: string,
    dateOfBirth?: Date | null,
    role?: 'user' | 'coach'
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, password });
      // authService.login already calls setAuthToken via saveTokens()
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    phone?: string,
    dateOfBirth?: Date | null,
    role: 'user' | 'coach' = 'user'
  ) => {
    set({ isLoading: true });
    try {
      const response = await authService.register({ 
        email, 
        password, 
        firstName, 
        lastName,
        phone,
        dateOfBirth: dateOfBirth?.toISOString(),
        role
      });
      // authService.register already calls setAuthToken via saveTokens()
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // authService.logout already calls clearTokens()
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getUser();
        set({ user, isAuthenticated: true });
      } else {
        await clearAuthToken();
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      await clearAuthToken();
      set({ user: null, isAuthenticated: false });
    }
  },
}));