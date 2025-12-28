export interface GlucoseReading {
  id: string;
  user_id: string;
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  measured_at: string;
  source: 'manual' | 'healthkit' | 'terra' | 'dexcom';
  source_device?: string;
  notes?: string;
  meal_context?: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other';
  created_at: string;
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