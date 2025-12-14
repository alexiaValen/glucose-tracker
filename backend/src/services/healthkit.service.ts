import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface GlucoseReading {
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  measuredAt: string;
  source: string;
  sourceDevice?: string;
}

export class HealthKitService {
  private isAvailable: boolean = false;
  private isAuthorized: boolean = false;

  // Initialize HealthKit
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err, available) => {
        if (err) {
          console.error('HealthKit error:', err);
          this.isAvailable = false;
          resolve(false);
          return;
        }
        this.isAvailable = available;
        resolve(available);
      });
    });
  }

  // Request permissions
  async requestAuthorization(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.initialize();
    }

    const permissions: HealthKitPermissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.BloodGlucose,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
        write: [], // We don't write to HealthKit
      },
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          console.error('HealthKit authorization error:', err);
          this.isAuthorized = false;
          resolve(false);
          return;
        }
        this.isAuthorized = true;
        resolve(true);
      });
    });
  }

  // Fetch glucose samples
  async getGlucoseSamples(startDate: Date, endDate: Date): Promise<GlucoseReading[]> {
    if (!this.isAuthorized) {
      throw new Error('HealthKit not authorized');
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 1000,
      };

      AppleHealthKit.getBloodGlucoseSamples(options, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        const readings: GlucoseReading[] = results.map((sample: any) => ({
          value: sample.value,
          unit: 'mg/dL', // HealthKit returns mg/dL by default
          measuredAt: sample.startDate,
          source: 'healthkit',
          sourceDevice: sample.sourceName || 'Unknown',
        }));

        resolve(readings);
      });
    });
  }

  // Sync glucose data to backend
  async syncGlucoseToBackend(accessToken: string): Promise<{ synced: number; skipped: number }> {
    try {
      // Get last sync time from local storage or backend
      const lastSyncTime = await this.getLastSyncTime();
      const now = new Date();

      // Fetch samples since last sync
      const samples = await this.getGlucoseSamples(lastSyncTime, now);

      if (samples.length === 0) {
        console.log('No new glucose samples to sync');
        return { synced: 0, skipped: 0 };
      }

      // Send to backend
      const response = await axios.post(
        `${API_URL}/api/v1/integrations/healthkit/sync`,
        { readings: samples },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update last sync time
      await this.setLastSyncTime(now);

      return {
        synced: response.data.synced || samples.length,
        skipped: response.data.skipped || 0,
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  // Background sync (call every 15 minutes)
  async backgroundSync(accessToken: string): Promise<void> {
    try {
      const result = await this.syncGlucoseToBackend(accessToken);
      console.log(`Background sync completed: ${result.synced} synced, ${result.skipped} skipped`);
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Helper: Get last sync time
  private async getLastSyncTime(): Promise<Date> {
    // TODO: Implement AsyncStorage or SecureStore
    // For now, default to 24 hours ago
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  // Helper: Set last sync time
  private async setLastSyncTime(date: Date): Promise<void> {
    // TODO: Implement AsyncStorage or SecureStore
    console.log('Last sync time updated:', date.toISOString());
  }

  // Get most recent glucose reading
  async getMostRecentGlucose(): Promise<GlucoseReading | null> {
    if (!this.isAuthorized) {
      return null;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const samples = await this.getGlucoseSamples(oneDayAgo, now);
    return samples.length > 0 ? samples[0] : null;
  }
}

export const healthKitService = new HealthKitService();
