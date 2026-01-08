// mobile-app/src/types/cycle.ts

export interface CycleLog {
  id: string;
  user_id: string;
  cycle_start_date: string;  // ✅ snake_case to match backend
  cycle_end_date?: string;   // ✅ snake_case
  phase: string;
  current_day: number;
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  notes?: string;
  created_at?: string;
}

export interface CreateCycleRequest {
  cycleStartDate: string;    // ✅ camelCase for API request
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
}

export interface UpdateCycleRequest {
  cycleEndDate?: string;     // ✅ camelCase for API request
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
}

export const CYCLE_PHASES = [
  { id: 'menstrual', label: 'Menstrual', days: '1-5' },
  { id: 'follicular', label: 'Follicular', days: '6-13' },
  { id: 'ovulation', label: 'Ovulation', days: '14-16' },
  { id: 'luteal', label: 'Luteal', days: '17-28' },
];