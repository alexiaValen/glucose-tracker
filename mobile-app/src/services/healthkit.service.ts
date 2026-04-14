// mobile-app/src/services/healthkit.service.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthKitGlucoseReading {
  value: number;
  timestamp: string;
  source: string;
  sourceDevice?: string;
}

export interface SyncResult {
  synced: number;
  skipped: number;
  alerts: Array<{ value: number; type: string; severity: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAST_SYNC_KEY  = 'healthkit_last_sync';
const AUTOSYNC_KEY   = 'healthkit_autosync_enabled';

const HK_PERMISSIONS = {
  permissions: {
    read:  ['BloodGlucose' as any],
    write: [] as any[],
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

class HealthKitService {
  private isInitialized = false;
  private syncInterval:  ReturnType<typeof setInterval> | null = null;

  // ── Init & Permissions ────────────────────────────────────────────────────

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    try {
      // Dynamic import so non-iOS builds don't crash
      const AppleHealthKit = require('react-native-health');
      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(HK_PERMISSIONS, (err: string) => {
          if (err) {
            console.error('HealthKit init error:', err);
            resolve(false);
          } else {
            this.isInitialized = true;
            console.log('✅ HealthKit initialized');
            resolve(true);
          }
        });
      });
    } catch (err) {
      console.error('HealthKit unavailable:', err);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    return this.initialize();
  }

  isAvailable(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  // ── Read from HealthKit ───────────────────────────────────────────────────

  async readGlucoseData(startDate: Date, endDate: Date): Promise<HealthKitGlucoseReading[]> {
    if (!this.isAvailable()) throw new Error('HealthKit not available or authorized');

    const AppleHealthKit = require('react-native-health');
    const options = {
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
      ascending: false,
      limit:     1000,
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.getBloodGlucoseSamples(options, (err: string, results: any[]) => {
        if (err) { reject(new Error(err)); return; }
        const readings: HealthKitGlucoseReading[] = (results || []).map((s: any) => ({
          value:        Number(s.value),
          timestamp:    s.startDate,
          source:       s.sourceName || 'Apple Health',
          sourceDevice: s.sourceName,
        }));
        console.log(`📊 Read ${readings.length} HealthKit readings`);
        resolve(readings);
      });
    });
  }

  // ── Sync to backend ───────────────────────────────────────────────────────

  async syncToBackend(): Promise<SyncResult> {
    if (!this.isAvailable()) throw new Error('HealthKit not authorized');

    const lastSync = await this.getLastSyncTime();
    const now = new Date();

    const readings = await this.readGlucoseData(lastSync, now);

    if (readings.length === 0) {
      return { synced: 0, skipped: 0, alerts: [] };
    }

    // Map to the shape the backend expects
    const payload = readings.map((r) => ({
      value:        r.value,
      measuredAt:   r.timestamp,
      unit:         'mg/dL',
      source:       'healthkit',
      sourceDevice: r.sourceDevice,
    }));

    const response = await api.post<SyncResult>('/glucose/sync', { readings: payload });

    await this.setLastSyncTime(now);
    console.log(`✅ Synced ${response.data.synced} readings, skipped ${response.data.skipped}`);

    return response.data;
  }

  // ── Last sync time persistence ────────────────────────────────────────────

  async getLastSyncTime(): Promise<Date> {
    try {
      const stored = await SecureStore.getItemAsync(LAST_SYNC_KEY);
      if (stored) return new Date(stored);
    } catch { /* ignore */ }
    // Default: last 7 days for first sync
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  async setLastSyncTime(date: Date): Promise<void> {
    try {
      await SecureStore.setItemAsync(LAST_SYNC_KEY, date.toISOString());
    } catch (err) {
      console.error('Failed to persist last sync time:', err);
    }
  }

  async clearLastSyncTime(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
    } catch { /* ignore */ }
  }

  // ── Auto-sync preference ──────────────────────────────────────────────────

  async getAutoSyncEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(AUTOSYNC_KEY);
      return val === 'true';
    } catch { return false; }
  }

  async setAutoSyncEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTOSYNC_KEY, String(enabled));
    } catch { /* ignore */ }
  }

  // ── Background auto-sync (in-process timer) ───────────────────────────────

  startAutoSync(intervalMinutes = 15): void {
    if (this.syncInterval) this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.syncToBackend().catch((err) =>
        console.error('Background auto-sync failed:', err)
      );
    }, intervalMinutes * 60 * 1000);
    console.log(`🔄 Auto-sync started every ${intervalMinutes} min`);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹ Auto-sync stopped');
    }
  }

  isAutoSyncRunning(): boolean {
    return this.syncInterval !== null;
  }
}

export const healthKitService = new HealthKitService();
export default healthKitService;
