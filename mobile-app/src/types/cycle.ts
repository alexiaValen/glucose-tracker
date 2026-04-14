// mobile-app/src/types/cycle.ts
// REDESIGN: Event-based cycle tracking with confidence inference.
// Existing CycleLog, CreateCycleRequest, UpdateCycleRequest preserved for API compat.

// ─── Existing API types (unchanged) ──────────────────────────────────────────

export interface CycleLog {
  id: string;
  user_id: string;
  cycle_start_date: string;
  cycle_end_date?: string;
  phase: string;
  current_day: number;
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  notes?: string;
  created_at?: string;
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
  { id: 'menstrual',   label: 'Menstrual',  days: '1–5'   },
  { id: 'follicular',  label: 'Follicular', days: '6–13'  },
  { id: 'ovulation',   label: 'Ovulation',  days: '14–16' },
  { id: 'luteal',      label: 'Luteal',     days: '17–28' },
];

// ─── Event-based types (new) ──────────────────────────────────────────────────

/**
 * Per-day bleeding status.
 * Ordered from no bleeding → heavy — used for visual intensity rendering.
 */
export type BleedingStatus = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

/** Common symptom labels shown as quick-select chips. */
export const SYMPTOM_OPTIONS = [
  'Cramps',
  'Fatigue',
  'Bloating',
  'Headache',
  'Mood swings',
  'Back pain',
  'Tender breasts',
  'Nausea',
] as const;

export type Symptom = typeof SYMPTOM_OPTIONS[number];

/**
 * A single day's log entry.
 * Stored locally via AsyncStorage; synced to backend when endpoint is available.
 */
export interface CycleEvent {
  date: string;           // YYYY-MM-DD (local date)
  bleeding: BleedingStatus;
  symptoms: string[];
  notes?: string;
  cycleId?: string;       // linked cycle if known
}

/** Map of date string → event, stored in AsyncStorage. */
export type CycleEventMap = Record<string, CycleEvent>;

// ─── Inference types (new) ────────────────────────────────────────────────────

export type InferenceStatus =
  | 'new_cycle'      // bleed after a gap — likely a fresh cycle
  | 'continuing'     // active bleed, cycle ongoing
  | 'possible_end'   // bleed has paused, might be ending
  | 'likely_ended'   // several dry days, cycle probably over
  | 'gap'            // missed logging days — needs gentle prompt
  | 'no_data';       // nothing logged yet

export type InferenceConfidence = 'high' | 'medium' | 'low';

export interface CycleInference {
  status: InferenceStatus;
  confidence: InferenceConfidence;
  headline: string;         // short, shown in card title
  body: string;             // supportive detail sentence
  confirmLabel?: string;    // primary action (e.g. "Yes, start new cycle")
  dismissLabel?: string;    // secondary action (e.g. "Not yet")
  dayNumber?: number;
  gapDays?: number;
}
