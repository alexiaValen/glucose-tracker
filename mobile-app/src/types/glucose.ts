// mobile-app/src/types/glucose.ts
export interface GlucoseReading {
  id: string;
  user_id: string;
  glucose_level: number;
  timestamp: string;
  notes?: string;
  source?: string;
  meal_context?: string;
  created_at: string;
}

export interface CreateGlucoseRequest {
  glucose_level: number;
  timestamp: string;
  notes?: string;
  source?: string;
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