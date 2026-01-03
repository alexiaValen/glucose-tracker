// mobile-app/src/services/healthKit.service.ts
import AppleHealthKit, {
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { api } from '../config/api';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.BloodGlucose],
    write: [AppleHealthKit.Constants.Permissions.BloodGlucose],
  },
};

export interface GlucoseReading {
  value: number;
  date: Date;
  source?: string;
}

export const healthKitService = {
  /**
   * Initialize HealthKit and request permissions
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('[HealthKit] Error initializing:', error);
          resolve(false);
        } else {
          console.log('[HealthKit] Initialized successfully');
          resolve(true);
        }
      });
    });
  },

  /**
   * Check if HealthKit is available
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err: Object, available: boolean) => {
        if (err) {
          console.error('[HealthKit] Error checking availability:', err);
          resolve(false);
        } else {
          resolve(available);
        }
      });
    });
  },

  /**
   * Read glucose data from Apple Health
   * @param startDate - Start date for the query
   * @param endDate - End date for the query (defaults to now)
   */
  async readGlucoseData(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<GlucoseReading[]> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      return [];
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 100,
      };

      AppleHealthKit.getBloodGlucoseSamples(
        options,
        (err: any, results: any[]) => {
          if (err) {
            console.error('[HealthKit] Error reading glucose:', err);
            reject(err);
          } else {
            const readings: GlucoseReading[] = results.map((reading) => ({
              value: reading.value,
              date: new Date(reading.startDate),
              source: reading.sourceName || 'Apple Health',
            }));
            console.log(`[HealthKit] Read ${readings.length} glucose readings`);
            resolve(readings);
          }
        }
      );
    });
  },

  /**
   * Write glucose data to Apple Health
   * @param value - Glucose value in mg/dL
   * @param date - Date of the reading
   */
  async writeGlucoseData(value: number, date: Date = new Date()): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        value: value,
        startDate: date.toISOString(),
        endDate: date.toISOString(),
      };

      AppleHealthKit.saveBloodGlucoseSample(
        options,
        (err: Object, result: any) => {
          if (err) {
            console.error('[HealthKit] Error writing glucose:', err);
            resolve(false);
          } else {
            console.log(`[HealthKit] Wrote glucose reading: ${value} mg/dL`);
            resolve(true);
          }
        }
      );
    });
  },

  /**
   * Get latest glucose reading from Apple Health
   */
  async getLatestGlucoseReading(): Promise<GlucoseReading | null> {
    if (Platform.OS !== 'ios') return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const readings = await this.readGlucoseData(yesterday);
    return readings.length > 0 ? readings[0] : null;
  },

  /**
   * Sync glucose data from Apple Health to app backend
   * @param onProgress - Callback for progress updates
   */
  async syncGlucoseToBackend(
    onProgress?: (current: number, total: number) => void
  ): Promise<{ synced: number; failed: number }> {
    try {
      // Get data from last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const readings = await this.readGlucoseData(startDate);
      console.log(`[HealthKit] Syncing ${readings.length} readings to backend`);

      let synced = 0;
      let failed = 0;

      for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];
        
        if (onProgress) {
          onProgress(i + 1, readings.length);
        }

        try {
          // Sync to backend
          await api.post('/glucose', {
            value: reading.value,
            measured_at: reading.date.toISOString(),
            source: reading.source || 'Apple Health',
          });
          
          synced++;
        } catch (error) {
          console.error('[HealthKit] Failed to sync reading:', error);
          failed++;
        }
      }

      console.log(`[HealthKit] Sync complete: ${synced} synced, ${failed} failed`);
      return { synced, failed };
    } catch (error) {
      console.error('[HealthKit] Sync error:', error);
      return { synced: 0, failed: 0 };
    }
  },

  /**
   * Get glucose statistics from Apple Health
   * @param days - Number of days to analyze
   */
  async getGlucoseStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.readGlucoseData(startDate);
    
    if (readings.length === 0) {
      return null;
    }

    const values = readings.map(r => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate time in range (70-180 mg/dL)
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const timeInRange = (inRange / values.length) * 100;

    return {
      average: Math.round(avg),
      min: Math.round(min),
      max: Math.round(max),
      timeInRange: Math.round(timeInRange),
      totalReadings: readings.length,
    };
  },
};