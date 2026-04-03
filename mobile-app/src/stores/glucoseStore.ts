// mobile-app/src/stores/glucoseStore.ts
import { create } from 'zustand';
import { GlucoseReading, GlucoseStats } from '../types/glucose';
import { glucoseService } from '../services/glucose.service';
import { useAuthStore } from './authStore';
import { getActiveUserId } from './coachStore';
import { api } from '../config/api';

interface GlucoseState {
  readings: GlucoseReading[];
  stats: GlucoseStats | null;
  isLoading: boolean;
  fetchReadings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addReading: (value: number, mealContext?: string, notes?: string) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
}

export const useGlucoseStore = create<GlucoseState>((set, get) => ({
  readings: [],
  stats: null,
  isLoading: false,

  fetchReadings: async () => {
    set({ isLoading: true });
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id);
      const isViewingClient = useAuthStore.getState().user?.role === 'coach' && !!userId;

      let normalizedReadings: GlucoseReading[] = [];

      if (isViewingClient && userId !== useAuthStore.getState().user?.id) {
        // Coach viewing client — use coach endpoint
        const response = await api.get(`/coach/clients/${userId}/glucose`, {
          params: { limit: 20 },
        });
        const data = response.data?.readings ?? response.data ?? [];
        normalizedReadings = Array.isArray(data) ? data : [];
      } else {
        // Normal user fetch
        const data = await glucoseService.getReadings(20, 0);
        normalizedReadings = Array.isArray(data)
          ? (data as GlucoseReading[])
          : Array.isArray((data as any)?.readings)
            ? ((data as any).readings as GlucoseReading[])
            : [];
      }

      set({ readings: normalizedReadings, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch readings:', error);
      set({ readings: [], isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id);
      const isViewingClient = useAuthStore.getState().user?.role === 'coach' && !!userId
        && userId !== useAuthStore.getState().user?.id;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      if (isViewingClient) {
        const response = await api.get(`/coach/clients/${userId}/stats`, {
          params: { startDate: sevenDaysAgo, endDate: now },
        });
        set({ stats: response.data });
      } else {
        const stats = await glucoseService.getStats(sevenDaysAgo, now);
        set({ stats });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  addReading: async (value: number, mealContext?: string, notes?: string) => {
    // Never allow writing when viewing as client
    const { viewingClientId } = await import('./coachStore').then(m => ({ viewingClientId: m.useCoachStore.getState().viewingClientId }));
    if (viewingClientId) return;

    set({ isLoading: true });
    try {
      const newReading = await glucoseService.createReading({
        glucose_level: value,
        timestamp: new Date().toISOString(),
        meal_context: mealContext as any,
        notes,
        source: 'manual',
      });
      set((state) => ({
        readings: [newReading, ...state.readings],
        isLoading: false,
      }));
      await get().fetchStats();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteReading: async (id: string) => {
    const { viewingClientId } = await import('./coachStore').then(m => ({ viewingClientId: m.useCoachStore.getState().viewingClientId }));
    if (viewingClientId) return;

    try {
      await glucoseService.deleteReading(id);
      set((state) => ({
        readings: state.readings.filter((r) => r.id !== id),
      }));
      await get().fetchStats();
    } catch (error) {
      console.error('Failed to delete reading:', error);
      throw error;
    }
  },
}));