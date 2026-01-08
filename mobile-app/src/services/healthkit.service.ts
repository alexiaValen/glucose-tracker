// mobile-app/src/services/healthKit.service.ts
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
  HealthInputOptions,
} from 'react-native-health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { glucoseService } from './glucose.service';
import { CreateGlucoseRequest } from '../types/glucose';

const LAST_SYNC_KEY = 'HEALTH_KIT_LAST_SYNC';
const AUTO_SYNC_ENABLED_KEY = 'HEALTH_KIT_AUTO_SYNC';

interface HealthKitGlucoseReading {
  value: number;
  timestamp: string;
  source?: string;
}

class HealthKitService {
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize HealthKit with required permissions
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit only available on iOS');
      return false;
    }

    return new Promise((resolve) => {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.BloodGlucose,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.BloodGlucose,
          ],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          this.isInitialized = false;
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
   * Check if HealthKit is available and authorized
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    if (!this.isInitialized) {
      return await this.initialize();
    }
    return this.isInitialized;
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Update the last sync timestamp
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }

  /**
   * Read glucose data from Apple Health
   * @param startDate - Start date for query (defaults to last sync or 7 days ago)
   * @param endDate - End date for query (defaults to now)
   */
  async readGlucoseData(
    startDate?: Date,
    endDate?: Date
  ): Promise<HealthKitGlucoseReading[]> {
    if (!await this.isAvailable()) {
      throw new Error('HealthKit not available');
    }

    // Default to last sync time or 7 days ago
    const lastSync = await this.getLastSyncTime();
    const defaultStart = lastSync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const options: HealthInputOptions = {
      startDate: (startDate || defaultStart).toISOString(),
      endDate: (endDate || new Date()).toISOString(),
      ascending: false,
      limit: 1000, // Max readings to fetch
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.getBloodGlucoseSamples(
        options,
        (error: Object, results: HealthValue[]) => {
          if (error) {
            console.error('Error reading glucose from HealthKit:', error);
            reject(error);
            return;
          }

          const readings: HealthKitGlucoseReading[] = results.map((sample) => ({
            value: sample.value,
            timestamp: sample.startDate,
            source: 'Apple Health', // HealthValue doesn't expose source in type definition
          }));

          resolve(readings);
        }
      );
    });
  }

  /**
   * Write glucose reading to Apple Health
   */
  async writeGlucoseReading(
    value: number,
    timestamp: Date = new Date()
  ): Promise<boolean> {
    if (!await this.isAvailable()) {
      console.error('HealthKit not available');
      return false;
    }

    const options = {
      value,
      startDate: timestamp.toISOString(),
      endDate: timestamp.toISOString(),
    };

    return new Promise((resolve) => {
      AppleHealthKit.saveBloodGlucoseSample(
        options,
        (error: Object) => {
          if (error) {
            console.error('Error writing glucose to HealthKit:', error);
            resolve(false);
          } else {
            console.log('Successfully wrote glucose to HealthKit');
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Sync glucose data from Apple Health to backend
   * Returns number of new readings synced
   */
  async syncToBackend(): Promise<number> {
    try {
      console.log('Starting HealthKit sync...');
      
      // Read glucose data from Health
      const readings = await this.readGlucoseData();
      
      if (readings.length === 0) {
        console.log('No new glucose readings to sync');
        await this.updateLastSyncTime();
        return 0;
      }

      console.log(`Found ${readings.length} glucose readings from Health`);

      // Upload to backend
      let syncedCount = 0;
      for (const reading of readings) {
        try {
          // Convert to the format expected by your glucose service
          const createRequest: CreateGlucoseRequest = {
            glucose_level: reading.value,
            // measuredAt: reading.timestamp,
            timestamp: reading.timestamp,
            notes: `Synced from ${reading.source || 'Apple Health'}`,
            source: reading.source || 'Apple Health',
          };
          
          await glucoseService.createReading(createRequest);
          syncedCount++;
        } catch (error) {
          // Skip duplicates or errors
          console.log('Skipping reading:', error);
        }
      }

      console.log(`Successfully synced ${syncedCount} readings`);
      await this.updateLastSyncTime();
      
      return syncedCount;
    } catch (error) {
      console.error('Error syncing to backend:', error);
      throw error;
    }
  }

  /**
   * Sync glucose data from backend to Apple Health
   * (For readings entered in app)
   */
  async syncFromBackend(readings: any[]): Promise<number> {
    if (!await this.isAvailable()) {
      return 0;
    }

    let syncedCount = 0;
    for (const reading of readings) {
      const success = await this.writeGlucoseReading(
        reading.glucose_level,
        new Date(reading.timestamp)
      );
      if (success) syncedCount++;
    }

    return syncedCount;
  }

  /**
   * Enable/disable auto-sync
   */
  async setAutoSync(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled.toString());
      
      if (enabled) {
        await this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    } catch (error) {
      console.error('Error setting auto-sync:', error);
    }
  }

  /**
   * Check if auto-sync is enabled
   */
  async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(AUTO_SYNC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Start background auto-sync (every 15 minutes)
   */
  async startAutoSync(): Promise<void> {
    // Stop existing interval if any
    this.stopAutoSync();

    // Sync immediately
    await this.syncToBackend().catch(console.error);

    // Start interval (15 minutes)
    this.syncInterval = setInterval(async () => {
      console.log('Auto-sync triggered');
      await this.syncToBackend().catch(console.error);
    }, 15 * 60 * 1000);

    console.log('Auto-sync started');
  }

  /**
   * Stop background auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Get latest glucose reading from Health
   */
  async getLatestGlucose(): Promise<HealthKitGlucoseReading | null> {
    try {
      const readings = await this.readGlucoseData(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        new Date()
      );

      return readings.length > 0 ? readings[0] : null;
    } catch (error) {
      console.error('Error getting latest glucose:', error);
      return null;
    }
  }

  /**
   * Request permissions (in case they were denied before)
   */
  async requestPermissions(): Promise<boolean> {
    this.isInitialized = false;
    return await this.initialize();
  }
}

export const healthKitService = new HealthKitService();