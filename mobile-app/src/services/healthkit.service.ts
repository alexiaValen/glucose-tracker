// mobile-app/src/services/healthKit.service.ts
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { glucoseService } from './glucose.service';
import { CreateGlucoseRequest } from '../types/glucose';
//import { colors } from '../theme/colors';

// HealthKit Glucose Reading Type
export interface HealthKitGlucoseReading {
  value: number;
  timestamp: string;
  source: string;
}

// Permission configuration
const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.BloodGlucose],
    write: [AppleHealthKit.Constants.Permissions.BloodGlucose],
  },
};

class HealthKitService {
  private isInitialized = false;
  private lastSyncTime: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize HealthKit with permissions
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('HealthKit initialization error:', error);
          resolve(false);
        } else {
          console.log('HealthKit initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Check if HealthKit is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  /**
   * Read glucose data from HealthKit
   */
  async readGlucoseData(
    startDate?: Date,
    endDate?: Date
  ): Promise<HealthKitGlucoseReading[]> {
    if (!this.isAvailable()) {
      throw new Error('HealthKit is not available');
    }

    const options = {
      startDate: startDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate?.toISOString() || new Date().toISOString(),
      ascending: false,
      limit: 1000,
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.getBloodGlucoseSamples(
        options,
        (error: Object, results: HealthValue[]) => {
          if (error) {
            reject(error);
          } else {
            const readings: HealthKitGlucoseReading[] = results.map((sample) => ({
              value: sample.value,
              timestamp: sample.startDate,
              source: 'Apple Health',
            }));
            resolve(readings);
          }
        }
      );
    });
  }

  /**
   * Write glucose data to HealthKit
   */
  async writeGlucoseData(value: number, timestamp?: Date): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('HealthKit is not available');
    }

    const options = {
      value,
      startDate: timestamp?.toISOString() || new Date().toISOString(),
      metadata: {
        HKWasUserEntered: true,
      },
    };

    return new Promise((resolve) => {
      AppleHealthKit.saveBloodGlucoseSample(
        options,
        (error: Object) => {
          if (error) {
            console.error('Error writing glucose to HealthKit:', error);
            resolve(false);
          } else {
            console.log('Glucose data written to HealthKit');
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Sync glucose data from HealthKit to backend
   */
  async syncToBackend(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const readings = await this.readGlucoseData(startDate, endDate);
      
      let syncedCount = 0;
      for (const reading of readings) {
        try {
          const createRequest: CreateGlucoseRequest = {
            glucose_level: reading.value,
            timestamp: reading.timestamp,
            notes: 'Synced from Apple Health',
            source: 'Apple Health',
          };
          
          await glucoseService.createReading(createRequest);
          syncedCount++;
        } catch (error) {
          console.error('Error syncing reading:', error);
          // Continue with next reading even if one fails
        }
      }

      this.lastSyncTime = new Date();
      return syncedCount;
    } catch (error) {
      console.error('Error syncing to backend:', error);
      throw error;
    }
  }

  /**
   * Start automatic background sync
   */
  startAutoSync(intervalMinutes: number = 15): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    console.log(`Starting auto-sync every ${intervalMinutes} minutes`);
    
    this.syncInterval = setInterval(
      () => {
        this.syncToBackend().catch((error) => {
          console.error('Auto-sync failed:', error);
        });
      },
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Request HealthKit permissions (alias for initialize)
   */
  async requestPermissions(): Promise<boolean> {
    return this.initialize();
  }

  /**
   * Get latest glucose reading from HealthKit
   */
  async getLatestGlucose(): Promise<HealthKitGlucoseReading | null> {
    try {
      const readings = await this.readGlucoseData();
      return readings.length > 0 ? readings[0] : null;
    } catch (error) {
      console.error('Error getting latest glucose:', error);
      return null;
    }
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled(): boolean {
    return this.syncInterval !== null;
  }

  /**
   * Set auto-sync enabled/disabled
   */
  setAutoSync(enabled: boolean): void {
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }
}

export const healthKitService = new HealthKitService();
export default healthKitService;