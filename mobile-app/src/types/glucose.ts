export interface GlucoseReading {
  id: string;
  userId: string;
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  measuredAt: string;
  source: 'manual' | 'healthkit' | 'terra' | 'dexcom';
  sourceDevice?: string;
  notes?: string;
  mealContext?: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other';
  createdAt: string;
}

export interface GlucoseStats {
  avgGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  stdDeviation: number;
  timeInRange: number;
  readingsCount: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface CreateGlucoseRequest {
  value: number;
  measuredAt: string;
  unit?: 'mg/dL' | 'mmol/L';
  notes?: string;
  mealContext?: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other';
}