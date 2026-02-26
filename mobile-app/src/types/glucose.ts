// mobile-app/src/types/glucose.ts
export interface GlucoseReading {
  id: string;
  user_id: string;
  // API returns 'value'; legacy frontend used 'glucose_level'
  value?: number;
  glucose_level?: number;
  // API returns 'measured_at'; legacy frontend used 'timestamp'
  measured_at?: string;
  timestamp?: string;
  notes?: string;
  source?: string;
  unit?: string;
  meal_context?: string;
  created_at: string;
}

export interface CreateGlucoseRequest {
  // Accept both field name conventions
  value?: number;
  glucose_level?: number;
  measuredAt?: string;
  measured_at?: string;
  timestamp?: string;
  notes?: string;
  source?: string;
  unit?: string;
  meal_context?: string;
}

export interface GlucoseStats {
  avgGlucose: number;    
  minGlucose: number;       
  maxGlucose: number;     
  timeInRange: number;
  
  average: number;
  min: number;
  max: number;
  count: number;
  total_readings?: number;  // Backend returns this
  min_value?: number;       // Backend returns this
  max_value?: number;       // Backend returns this
  std_dev?: number;         // Backend returns this
  in_range_percentage?: number;
  target_range?: {
    min: number;
    max: number;
  };
}

export interface GlucoseChartData {
  timestamp: string;
  value: number;
  label?: string;
}