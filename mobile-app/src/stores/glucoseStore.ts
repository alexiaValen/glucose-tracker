import { create } from 'zustand';
import { GlucoseReading, GlucoseStats } from '../types/glucose';
import { glucoseService } from '../services/glucose.service';
import { healthKitService } from '../services/healthkit.service';

interface GlucoseState {
  readings: GlucoseReading[];
  stats: GlucoseStats | null;
  isLoading: boolean;
  fetchReadings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addReading: (value: number, mealContext?: string, notes?: string) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
  syncFromHealthKit: () => Promise<number>;
  initializeHealthKit: () => Promise<boolean>;
}

export const useGlucoseStore = create<GlucoseState>((set, get) => ({
  readings: [],
  stats: null,
  isLoading: false,

  fetchReadings: async () => {
    set({ isLoading: true });
    try {
      const data = await glucoseService.getReadings(20, 0);
      set({ readings: data.readings, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch readings:', error);
      set({ isLoading: false });
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
        value,
        measuredAt: new Date().toISOString(),
        unit: 'mg/dL',
        mealContext: mealContext as any,
        notes,
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

  // HealthKit sync methods
  syncFromHealthKit: async () => {
    set({ isLoading: true });
    try {
      // Get readings from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const healthKitSamples = await healthKitService.getGlucoseSamples(sevenDaysAgo);

      console.log(`Found ${healthKitSamples.length} HealthKit glucose samples`);

      // Import each sample into our database
      let syncedCount = 0;
      for (const sample of healthKitSamples) {
        try {
          const value = healthKitService.convertToMgDl(sample.value, 'mg/dL');
          const measuredAt = new Date(sample.startDate);

          // Check if we already have this reading (avoid duplicates)
          const exists = get().readings.some(
            (r) =>
              Math.abs(r.value - value) < 1 &&
              Math.abs(new Date(r.measuredAt).getTime() - measuredAt.getTime()) < 60000 // within 1 minute
          );

          if (!exists) {
            await glucoseService.createReading({
              value,
              measuredAt: measuredAt.toISOString(),
              unit: 'mg/dL',
              mealContext: 'other',
              notes: 'Synced from Apple Health',
            });
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing individual reading:', error);
        }
      }

      console.log(`✅ Synced ${syncedCount} new readings from HealthKit`);

      // Refresh the readings list
      await get().fetchReadings();
      await get().fetchStats();

      set({ isLoading: false });
      return syncedCount;
    } catch (error) {
      console.error('HealthKit sync error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  initializeHealthKit: async () => {
    try {
      const initialized = await healthKitService.initialize();
      return initialized;
    } catch (error) {
      console.error('Failed to initialize HealthKit:', error);
      return false;
    }
  },
}));