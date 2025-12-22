import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';
import { Platform } from 'react-native';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.HeartRate,
    ],
    write: [AppleHealthKit.Constants.Permissions.BloodGlucose],
  },
};

export const healthKitService = {
  // Check if HealthKit is available (iOS only)
  isAvailable(): boolean {
    return Platform.OS === 'ios';
  },

  // Initialize and request permissions
  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
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

  // Get glucose samples from HealthKit
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

      AppleHealthKit.getBloodGlucoseSamples(options, (error, results) => {
        if (error) {
          console.error('Error fetching glucose samples:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  },

  // Get latest glucose reading
  async getLatestGlucose(): Promise<HealthValue | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const samples = await this.getGlucoseSamples(oneDayAgo);
    
    return samples.length > 0 ? samples[0] : null;
  },

  // Save glucose reading to HealthKit
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

      AppleHealthKit.saveBloodGlucoseSample(options, (error) => {
        if (error) {
          console.error('Error saving glucose to HealthKit:', error);
          resolve(false);
        } else {
          console.log('✅ Glucose saved to HealthKit');
          resolve(true);
        }
      });
    });
  },

  // Convert HealthKit glucose value to mg/dL
  convertToMgDl(value: number, unit: string): number {
    // HealthKit returns glucose in mg/dL by default
    // If it's in mmol/L, convert it
    if (unit === 'mmol/L') {
      return value * 18.0182; // Conversion factor
    }
    return value;
  },
};