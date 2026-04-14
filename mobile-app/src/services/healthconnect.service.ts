// mobile-app/src/services/healthconnect.service.ts
// Android Health Connect equivalent of healthkit.service.ts.
// Uses react-native-health-connect (dynamic require so iOS builds never touch it).
// Interface is intentionally identical to HealthKitService so HealthSyncScreen
// can swap the two without any branching logic.

import { Platform, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../config/api';

// ─── Re-export shared type so the screen only imports from one place ──────────
export interface SyncResult {
  synced:  number;
  skipped: number;
  alerts:  Array<{ value: number; type: string; severity: string }>;
}

export type SdkStatus = 'available' | 'not_installed' | 'not_supported';

// ─── Constants ────────────────────────────────────────────────────────────────
const LAST_SYNC_KEY = 'hc_last_sync';
const AUTOSYNC_KEY  = 'hc_autosync_enabled';

const HC_PERMISSIONS = [{ accessType: 'read' as const, recordType: 'BloodGlucose' as const }];

// ─── Service ──────────────────────────────────────────────────────────────────
class HealthConnectService {
  private _ready       = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  // ── Internals ─────────────────────────────────────────────────────────────

  private lib() {
    // Dynamic require — never bundled on iOS
    return require('react-native-health-connect');
  }

  // ── SDK availability check ─────────────────────────────────────────────────

  async getSdkStatus(): Promise<SdkStatus> {
    if (Platform.OS !== 'android') return 'not_supported';
    try {
      const { getSdkStatus, SdkAvailabilityStatus } = this.lib();
      const code = await getSdkStatus();
      if (code === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
      if (code === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'not_installed';
      return 'not_supported';
    } catch {
      return 'not_supported';
    }
  }

  // ── Initialize (must call before readRecords) ─────────────────────────────

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const sdkStatus = await this.getSdkStatus();
    if (sdkStatus !== 'available') return false;
    try {
      const { initialize } = this.lib();
      this._ready = await initialize();
      return this._ready;
    } catch (err) {
      console.error('[HealthConnect] initialize error:', err);
      return false;
    }
  }

  // ── Request read permission ───────────────────────────────────────────────

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    // Ensure SDK is initialized first
    if (!this._ready) {
      const ok = await this.initialize();
      if (!ok) return false;
    }
    try {
      const { requestPermission } = this.lib();
      const granted: any[] = await requestPermission(HC_PERMISSIONS);
      this._ready = granted.length > 0;
      return this._ready;
    } catch (err) {
      console.error('[HealthConnect] requestPermissions error:', err);
      return false;
    }
  }

  isAvailable(): boolean {
    return Platform.OS === 'android' && this._ready;
  }

  // ── Read blood glucose records ────────────────────────────────────────────

  private async readGlucoseData(
    startDate: Date,
    endDate:   Date,
  ): Promise<Array<{ value: number; timestamp: string; source: string }>> {
    const { readRecords } = this.lib();
    const result = await readRecords('BloodGlucose', {
      timeRangeFilter: {
        operator:  'between',
        startTime: startDate.toISOString(),
        endTime:   endDate.toISOString(),
      },
    });

    return (result?.records ?? []).map((r: any) => ({
      // Health Connect stores glucose in mmol/L natively; convert if needed
      value:     r.level?.inMilligramsPerDeciliter ?? (r.level?.inMillimolesPerLiter ?? 0) * 18.0182,
      timestamp: r.time,
      source:    r.metadata?.dataOrigin ?? 'Health Connect',
    }));
  }

  // ── Sync to backend ───────────────────────────────────────────────────────

  async syncToBackend(): Promise<SyncResult> {
    if (!this.isAvailable()) throw new Error('Health Connect not authorized');

    const lastSync = await this.getLastSyncTime();
    const now      = new Date();
    const readings = await this.readGlucoseData(lastSync, now);

    if (readings.length === 0) return { synced: 0, skipped: 0, alerts: [] };

    const payload = readings.map((r) => ({
      value:      r.value,
      measuredAt: r.timestamp,
      unit:       'mg/dL',
      source:     'health_connect',
    }));

    const response = await api.post<SyncResult>('/glucose/sync', { readings: payload });
    await this.setLastSyncTime(now);
    console.log(`[HealthConnect] synced ${response.data.synced}, skipped ${response.data.skipped}`);
    return response.data;
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  async getLastSyncTime(): Promise<Date> {
    try {
      const stored = await SecureStore.getItemAsync(LAST_SYNC_KEY);
      if (stored) return new Date(stored);
    } catch { /* ignore */ }
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days
  }

  async setLastSyncTime(date: Date): Promise<void> {
    await SecureStore.setItemAsync(LAST_SYNC_KEY, date.toISOString()).catch(() => {});
  }

  async clearLastSyncTime(): Promise<void> {
    await SecureStore.deleteItemAsync(LAST_SYNC_KEY).catch(() => {});
  }

  async getAutoSyncEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(AUTOSYNC_KEY);
      return val === 'true';
    } catch { return false; }
  }

  async setAutoSyncEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(AUTOSYNC_KEY, String(enabled)).catch(() => {});
  }

  // ── Background auto-sync (in-process timer) ───────────────────────────────

  startAutoSync(intervalMinutes = 15): void {
    if (this.syncInterval) this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.syncToBackend().catch((err) =>
        console.error('[HealthConnect] auto-sync error:', err)
      );
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  isAutoSyncRunning(): boolean {
    return this.syncInterval !== null;
  }

  // ── Utility: deep-link to Health Connect settings ─────────────────────────

  openSettings(): void {
    try {
      const { openHealthConnectSettings } = this.lib();
      openHealthConnectSettings();
    } catch {
      // Fallback: open app settings
      Linking.openSettings();
    }
  }

  openPlayStore(): void {
    Linking.openURL(
      'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
    ).catch(() => {});
  }
}

export const healthConnectService = new HealthConnectService();
export default healthConnectService;
