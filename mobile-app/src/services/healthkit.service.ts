// // mobile-app/src/services/healthkit.service.ts
// import AppleHealthKit, { 
//   HealthKitPermissions, 
//   HealthValue 
// } from 'react-native-health';
// import { Platform } from 'react-native';
// import { glucoseService } from './glucose.service';
// import { CreateGlucoseRequest } from '../types/glucose';

// export interface HealthKitGlucoseReading {
//   value: number;
//   timestamp: string;
//   source: string;
// }

// const permissions: HealthKitPermissions = {
//   permissions: {
//     read: [AppleHealthKit.Constants.Permissions.BloodGlucose],
//     write: [AppleHealthKit.Constants.Permissions.BloodGlucose],
//   },
// };

// class HealthKitService {
//   private isInitialized = false;
//   private lastSyncTime: Date | null = null;
//   private syncInterval: any = null;

//   async initialize(): Promise<boolean> {
//     if (Platform.OS !== 'ios') {
//       return false;
//     }

//     try {
//       return new Promise((resolve) => {
//         AppleHealthKit.initHealthKit(permissions, (error: string) => {
//           if (error) {
//             console.error('HealthKit error:', error);
//             resolve(false);
//           } else {
//             this.isInitialized = true;
//             resolve(true);
//           }
//         });
//       });
//     } catch (error) {
//       return false;
//     }
//   }

//   isAvailable(): boolean {
//     return Platform.OS === 'ios' && this.isInitialized;
//   }

//   async readGlucoseData(startDate?: Date, endDate?: Date): Promise<HealthKitGlucoseReading[]> {
//     if (!this.isAvailable()) throw new Error('HealthKit not available');

//     const options = {
//       startDate: startDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
//       endDate: endDate?.toISOString() || new Date().toISOString(),
//       ascending: false,
//       limit: 1000,
//     };

//     return new Promise((resolve, reject) => {
//       AppleHealthKit.getBloodGlucoseSamples(options, (error: string, results: HealthValue[]) => {
//         if (error) {
//           reject(error);
//         } else {
//           const readings = (results || []).map((sample: any) => ({
//             value: sample.value,
//             timestamp: sample.startDate,
//             source: sample.sourceName || sample.source || 'Apple Health',
//           }));
//           resolve(readings);
//         }
//       });
//     });
//   }

//   async writeGlucoseData(value: number, timestamp?: Date): Promise<boolean> {
//     if (!this.isAvailable()) return false;

//     const options = {
//       value,
//       startDate: timestamp?.toISOString() || new Date().toISOString(),
//       metadata: { HKWasUserEntered: true },
//     };

//     return new Promise((resolve) => {
//       AppleHealthKit.saveBloodGlucoseSample(options, (error: string) => {
//         resolve(!error);
//       });
//     });
//   }

//   async syncToBackend(startDate?: Date, endDate?: Date): Promise<number> {
//     try {
//       const readings = await this.readGlucoseData(startDate, endDate);
//       if (readings.length === 0) return 0;

//       let syncedCount = 0;
//       for (const reading of readings) {
//         try {
//           await glucoseService.createReading({
//             glucose_level: reading.value,
//             timestamp: reading.timestamp,
//             notes: 'Synced from Apple Health',
//             source: 'Apple Health',
//           });
//           syncedCount++;
//         } catch (error: any) {
//           if (error?.response?.status === 409) continue;
//         }
//       }

//       this.lastSyncTime = new Date();
//       return syncedCount;
//     } catch (error) {
//       throw error;
//     }
//   }

//   startAutoSync(intervalMinutes: number = 15): void {
//     if (this.syncInterval) this.stopAutoSync();
//     this.syncInterval = setInterval(() => {
//       this.syncToBackend().catch(console.error);
//     }, intervalMinutes * 60 * 1000);
//   }

//   stopAutoSync(): void {
//     if (this.syncInterval) {
//       clearInterval(this.syncInterval);
//       this.syncInterval = null;
//     }
//   }

//   getLastSyncTime(): Date | null {
//     return this.lastSyncTime;
//   }

//   async requestPermissions(): Promise<boolean> {
//     return this.initialize();
//   }

//   async getLatestGlucose(): Promise<HealthKitGlucoseReading | null> {
//     try {
//       const readings = await this.readGlucoseData();
//       return readings.length > 0 ? readings[0] : null;
//     } catch {
//       return null;
//     }
//   }

//   isAutoSyncEnabled(): boolean {
//     return this.syncInterval !== null;
//   }

//   setAutoSync(enabled: boolean): void {
//     enabled ? this.startAutoSync() : this.stopAutoSync();
//   }
// }

// export const healthKitService = new HealthKitService();
// export default healthKitService;



// mobile-app/src/services/healthkit.service.ts
import * as AppleHealthKit from 'react-native-health';
import { Platform } from 'react-native';
import { glucoseService } from './glucose.service';
import { CreateGlucoseRequest } from '../types/glucose';

export interface HealthKitGlucoseReading {
  value: number;
  timestamp: string;
  source: string;
}

const permissions = {
  permissions: {
    read: ['BloodGlucose' as any],
    write: ['BloodGlucose' as any],
  },
};

class HealthKitService {
  private isInitialized = false;
  private lastSyncTime: Date | null = null;
  private syncInterval: any = null;

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return new Promise((resolve) => {
        (AppleHealthKit as any).initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('HealthKit error:', error);
            resolve(false);
          } else {
            console.log('✅ HealthKit initialized');
            this.isInitialized = true;
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('HealthKit init error:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  async readGlucoseData(startDate?: Date, endDate?: Date): Promise<HealthKitGlucoseReading[]> {
    if (!this.isAvailable()) throw new Error('HealthKit not available');

    const options = {
      startDate: startDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate?.toISOString() || new Date().toISOString(),
      ascending: false,
      limit: 1000,
    };

    return new Promise((resolve, reject) => {
      (AppleHealthKit as any).getBloodGlucoseSamples(options, (error: string, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          const readings = (results || []).map((sample: any) => ({
            value: sample.value,
            timestamp: sample.startDate,
            source: sample.sourceName || sample.source || 'Apple Health',
          }));
          console.log(`📊 Read ${readings.length} readings`);
          resolve(readings);
        }
      });
    });
  }

  async writeGlucoseData(value: number, timestamp?: Date): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const options = {
      value,
      startDate: timestamp?.toISOString() || new Date().toISOString(),
      metadata: { HKWasUserEntered: true },
    };

    return new Promise((resolve) => {
      (AppleHealthKit as any).saveBloodGlucoseSample(options, (error: string) => {
        if (error) {
          console.error('Write error:', error);
          resolve(false);
        } else {
          console.log('✅ Written to HealthKit');
          resolve(true);
        }
      });
    });
  }

  async syncToBackend(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const readings = await this.readGlucoseData(startDate, endDate);
      if (readings.length === 0) return 0;

      let syncedCount = 0;
      for (const reading of readings) {
        try {
          await glucoseService.createReading({
            glucose_level: reading.value,
            timestamp: reading.timestamp,
            notes: 'Synced from Apple Health',
            source: 'Apple Health',
          });
          syncedCount++;
        } catch (error: any) {
          if (error?.response?.status === 409) continue;
        }
      }

      this.lastSyncTime = new Date();
      console.log(`✅ Synced ${syncedCount} readings`);
      return syncedCount;
    } catch (error) {
      throw error;
    }
  }

  startAutoSync(intervalMinutes: number = 15): void {
    if (this.syncInterval) this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.syncToBackend().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  async requestPermissions(): Promise<boolean> {
    return this.initialize();
  }

  async getLatestGlucose(): Promise<HealthKitGlucoseReading | null> {
    try {
      const readings = await this.readGlucoseData();
      return readings.length > 0 ? readings[0] : null;
    } catch {
      return null;
    }
  }

  isAutoSyncEnabled(): boolean {
    return this.syncInterval !== null;
  }

  setAutoSync(enabled: boolean): void {
    enabled ? this.startAutoSync() : this.stopAutoSync();
  }
}

export const healthKitService = new HealthKitService();
export default healthKitService;