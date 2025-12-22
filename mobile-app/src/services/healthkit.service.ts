import * as AppleHealthKit from 'react-native-health';
import { Platform } from 'react-native';

interface HealthKitPermissions {
  permissions: {
    read: string[];
    write: string[];
  };
}

interface HealthValue {
  value: number;
  startDate: string;
  endDate: string;
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: ['BloodGlucose'],
    write: ['BloodGlucose'],
  },
};

export const healthKitService = {
  isAvailable(): boolean {
    return Platform.OS === 'ios';
  },

  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      (AppleHealthKit as any).initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('HealthKit initialization error:', error);
          resolve(false);
        } else {
          console.log('✅ HealthKit initialized successfully');
          resolve(true);
        }
      });
    });
  },

  async getGlucoseSamples(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<HealthValue[]> {
    if (!this.isAvailable()) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 100,
      };

      (AppleHealthKit as any).getBloodGlucoseSamples(
        options,
        (error: any, results: HealthValue[]) => {
          if (error) {
            console.error('Error fetching glucose samples:', error);
            reject(error);
          } else {
            resolve(results || []);
          }
        }
      );
    });
  },

  async getLatestGlucose(): Promise<HealthValue | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const samples = await this.getGlucoseSamples(oneDayAgo);
    
    return samples.length > 0 ? samples[0] : null;
  },

  async saveGlucoseReading(value: number, date: Date = new Date()): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        value,
        startDate: date.toISOString(),
        endDate: date.toISOString(),
      };

      (AppleHealthKit as any).saveBloodGlucoseSample(
        options,
        (error: any) => {
          if (error) {
            console.error('Error saving glucose to HealthKit:', error);
            resolve(false);
          } else {
            console.log('✅ Glucose saved to HealthKit');
            resolve(true);
          }
        }
      );
    });
  },

  convertToMgDl(value: number, unit: string): number {
    if (unit === 'mmol/L') {
      return value * 18.0182;
    }
    return value;
  },
};