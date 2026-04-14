// mobile-app/src/stores/cycleStore.ts
// REDESIGN: Adds event-based state on top of existing cycle start/end logic.
// All existing actions preserved. New: events, todayEvent, logEvent, inferStatus.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CycleLog, CycleEvent, CycleEventMap, CycleInference, BleedingStatus } from '../types/cycle';
import { cycleService } from '../services/cycle.service';
import { useAuthStore } from './authStore';
import { getActiveUserId } from './coachStore';
import { api } from '../config/api';

// ─── AsyncStorage key ────────────────────────────────────────────────────────
const EVENTS_KEY = 'cycle_events_v1';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Inference engine ─────────────────────────────────────────────────────────
/**
 * Derives a CycleInference from the current cycle + local event map + today's bleeding.
 * Called after every event save so the UI always reflects the latest understanding.
 */
export function inferCycleStatus(
  currentCycle: CycleLog | null,
  events: CycleEventMap,
  todayBleeding: BleedingStatus,
  today: Date = new Date(),
): CycleInference {
  const todayKey = toDateKey(today);

  // Collect all bleed events, sorted descending
  const bleedEntries = Object.entries(events)
    .filter(([, e]) => e.bleeding !== 'none')
    .sort(([a], [b]) => b.localeCompare(a));

  const lastBleedKey   = bleedEntries[0]?.[0] ?? null;
  const lastLogKey     = Object.keys(events).sort().reverse()[0] ?? null;

  const daysSinceLastBleed = lastBleedKey
    ? daysBetween(new Date(lastBleedKey), today) : 999;
  const daysSinceLastLog = lastLogKey
    ? daysBetween(new Date(lastLogKey), today) : 999;

  const isBleedingNow = todayBleeding !== 'none';

  // ── No active cycle ────────────────────────────────────────────────────────
  if (!currentCycle) {
    if (isBleedingNow) {
      return {
        status: 'new_cycle',
        confidence: 'high',
        headline: 'Looks like a new cycle',
        body: 'Is today day 1 of your period? Confirm to start tracking.',
        confirmLabel: 'Yes, start from today',
        dismissLabel: 'Pick a different date',
        dayNumber: 1,
      };
    }
    return {
      status: 'no_data',
      confidence: 'low',
      headline: '',
      body: '',
    };
  }

  // ── Active cycle ───────────────────────────────────────────────────────────
  const cycleStart  = new Date(currentCycle.cycle_start_date);
  const dayNumber   = daysBetween(cycleStart, today) + 1;

  // Missed logging: last log was 3+ days ago
  if (!isBleedingNow && daysSinceLastLog >= 3 && daysSinceLastLog < 999) {
    return {
      status: 'gap',
      confidence: 'medium',
      headline: `${daysSinceLastLog} days since your last entry`,
      body: "No pressure — log today and we'll fill in what we can.",
      dayNumber,
      gapDays: daysSinceLastLog,
    };
  }

  if (isBleedingNow) {
    // Bleeding today — but could be a new cycle after a long gap
    if (daysSinceLastBleed >= 5 && dayNumber > 21) {
      return {
        status: 'new_cycle',
        confidence: 'medium',
        headline: 'Could this be a new cycle?',
        body: `It's been ${daysSinceLastBleed} days since your last bleed, and you're on day ${dayNumber}.`,
        confirmLabel: 'Yes, start a new one',
        dismissLabel: 'No, still the same cycle',
        dayNumber,
        gapDays: daysSinceLastBleed,
      };
    }

    // Normal continuation
    return {
      status: 'continuing',
      confidence: 'high',
      headline: `Day ${dayNumber}`,
      body: "You're actively bleeding — cycle is continuing.",
      dayNumber,
    };
  }

  // Not bleeding today
  if (daysSinceLastBleed >= 5 && dayNumber >= 3) {
    return {
      status: 'likely_ended',
      confidence: 'high',
      headline: 'Bleeding has stopped',
      body: `It's been ${daysSinceLastBleed} days without flow. Does your cycle feel complete?`,
      confirmLabel: 'Yes, close this cycle',
      dismissLabel: 'Not yet',
      dayNumber,
      gapDays: daysSinceLastBleed,
    };
  }

  if (daysSinceLastBleed >= 2 && dayNumber >= 3) {
    return {
      status: 'possible_end',
      confidence: 'medium',
      headline: 'Flow seems lighter',
      body: 'A couple of days without logging. Is bleeding slowing down, or has it stopped?',
      confirmLabel: 'Cycle has ended',
      dismissLabel: 'Still going',
      dayNumber,
      gapDays: daysSinceLastBleed,
    };
  }

  return {
    status: 'continuing',
    confidence: 'high',
    headline: `Day ${dayNumber}`,
    body: 'Cycle is ongoing.',
    dayNumber,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface CycleState {
  cycles:       CycleLog[];
  currentCycle: CycleLog | null;
  isLoading:    boolean;

  // Event-based state
  events:       CycleEventMap;
  todayEvent:   CycleEvent | null;

  // Existing actions
  fetchCycles:       () => Promise<void>;
  fetchCurrentCycle: () => Promise<void>;
  startCycle:        (startDate: string, flow?: string, symptoms?: string[]) => Promise<void>;
  endCycle:          (id: string, endDate: string) => Promise<void>;

  // Event-based actions
  loadEvents:     () => Promise<void>;
  saveEvent:      (event: CycleEvent) => Promise<void>;
  getTodayEvent:  () => CycleEvent | null;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  cycles:       [],
  currentCycle: null,
  isLoading:    false,
  events:       {},
  todayEvent:   null,

  // ── Existing actions (unchanged) ────────────────────────────────────────────

  fetchCycles: async () => {
    set({ isLoading: true });
    try {
      const cycles = await cycleService.getCycles(12);
      set({ cycles, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchCurrentCycle: async () => {
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id);
      const isViewingClient =
        useAuthStore.getState().user?.role === 'coach' &&
        !!userId &&
        userId !== useAuthStore.getState().user?.id;

      if (isViewingClient) {
        const response = await api.get(`/coach/clients/${userId}/cycle`);
        const cycle = response.data?.cycle ?? response.data ?? null;
        set({ currentCycle: cycle });
      } else {
        const currentCycle = await cycleService.getCurrentCycle();
        set({ currentCycle });
      }
    } catch {
      set({ currentCycle: null });
    }
  },

  startCycle: async (startDate, flow, symptoms) => {
    const { viewingClientId } = (await import('./coachStore')).useCoachStore.getState();
    if (viewingClientId) return;
    set({ isLoading: true });
    try {
      const newCycle = await cycleService.createCycle({
        cycleStartDate: startDate,
        flow: flow as any,
        symptoms,
      });
      set((state) => ({
        cycles: [newCycle, ...state.cycles],
        currentCycle: newCycle,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  endCycle: async (id, endDate) => {
    const { viewingClientId } = (await import('./coachStore')).useCoachStore.getState();
    if (viewingClientId) return;
    try {
      const updatedCycle = await cycleService.updateCycle(id, { cycleEndDate: endDate });
      set((state) => ({
        cycles: state.cycles.map((c) => (c.id === id ? updatedCycle : c)),
        currentCycle: null,
      }));
    } catch (error) {
      throw error;
    }
  },

  // ── Event-based actions (new) ────────────────────────────────────────────────

  loadEvents: async () => {
    try {
      const raw = await AsyncStorage.getItem(EVENTS_KEY);
      const events: CycleEventMap = raw ? JSON.parse(raw) : {};
      const todayKey = toDateKey(new Date());
      set({ events, todayEvent: events[todayKey] ?? null });
    } catch {
      set({ events: {}, todayEvent: null });
    }
  },

  saveEvent: async (event: CycleEvent) => {
    const existing = get().events;
    const updated: CycleEventMap = { ...existing, [event.date]: event };
    try {
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
    } catch {}
    const isToday = event.date === toDateKey(new Date());
    set({ events: updated, todayEvent: isToday ? event : get().todayEvent });
    // Best-effort server sync
    cycleService.logEvent(event);
  },

  getTodayEvent: () => {
    const todayKey = toDateKey(new Date());
    return get().events[todayKey] ?? null;
  },
}));
