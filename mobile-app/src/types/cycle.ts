export interface CycleLog {
  id: string;
  user_id: string;
  cycle_start_date: string;
  cycle_end_date?: string;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  current_day: number;
  symptoms: string[];
  flow?: 'light' | 'medium' | 'heavy';
  created_at: string;
}

export interface CreateCycleRequest {
  cycleStartDate: string;
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
}

export interface UpdateCycleRequest {
  cycleEndDate?: string;
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
}

export const CYCLE_PHASES = [
  { id: 'menstrual', label: '🩸 Menstrual', days: '1-5', color: '#EF4444' },
  { id: 'follicular', label: '🌱 Follicular', days: '6-13', color: '#10B981' },
  { id: 'ovulation', label: '🥚 Ovulation', days: '14-16', color: '#F59E0B' },
  { id: 'luteal', label: '🌙 Luteal', days: '17-28', color: '#8B5CF6' },
];

export const CYCLE_SYMPTOMS = [
  'cramps',
  'bloating',
  'mood_swings',
  'fatigue',
  'headache',
  'breast_tenderness',
  'acne',
  'food_cravings',
];