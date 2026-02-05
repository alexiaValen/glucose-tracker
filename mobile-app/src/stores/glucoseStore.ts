import { create } from 'zustand';
import { GlucoseReading, GlucoseStats } from '../types/glucose';
import { glucoseService } from '../services/glucose.service';

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
    const data = await glucoseService.getReadings(20, 0);

    // ✅ Normalize: backend may return an array OR { readings: [] }
    const normalizedReadings = Array.isArray(data)
      ? (data as GlucoseReading[])
      : Array.isArray((data as any)?.readings)
        ? ((data as any).readings as GlucoseReading[])
        : [];

    set({ readings: normalizedReadings, isLoading: false });
  } catch (error) {
    console.error('Failed to fetch readings:', error);
    set({ readings: [], isLoading: false }); // ✅ keep it an array even on error
  }
},

  fetchStats: async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      const stats = await glucoseService.getStats(sevenDaysAgo, now);
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  addReading: async (value: number, mealContext?: string, notes?: string) => {
    set({ isLoading: true });
    try {
      const newReading = await glucoseService.createReading({
        glucose_level: value,
        timestamp: new Date().toISOString(),
        // unit: 'mg/dL', not needed
        meal_context: mealContext as any,
        notes,
        source: 'manual',
      });

      // Add to the beginning of the list
      set((state) => ({
        readings: [newReading, ...state.readings],
        isLoading: false,
      }));

      // Refresh stats
      await get().fetchStats();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteReading: async (id: string) => {
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