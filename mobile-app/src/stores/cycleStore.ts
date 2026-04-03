// mobile-app/src/stores/cycleStore.ts
import { create } from 'zustand';
import { CycleLog } from '../types/cycle';
import { cycleService } from '../services/cycle.service';
import { useAuthStore } from './authStore';
import { getActiveUserId } from './coachStore';
import { api } from '../config/api';

interface CycleState {
  cycles: CycleLog[];
  currentCycle: CycleLog | null;
  isLoading: boolean;
  fetchCycles: () => Promise<void>;
  fetchCurrentCycle: () => Promise<void>;
  startCycle: (startDate: string, flow?: string, symptoms?: string[]) => Promise<void>;
  endCycle: (id: string, endDate: string) => Promise<void>;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  cycles: [],
  currentCycle: null,
  isLoading: false,

  fetchCycles: async () => {
    set({ isLoading: true });
    try {
      const cycles = await cycleService.getCycles(12);
      set({ cycles, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
      set({ isLoading: false });
    }
  },

  fetchCurrentCycle: async () => {
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id);
      const isViewingClient = useAuthStore.getState().user?.role === 'coach'
        && !!userId && userId !== useAuthStore.getState().user?.id;

      if (isViewingClient) {
        const response = await api.get(`/coach/clients/${userId}/cycle`);
        const cycle = response.data?.cycle ?? response.data ?? null;
        set({ currentCycle: cycle });
      } else {
        const currentCycle = await cycleService.getCurrentCycle();
        set({ currentCycle });
      }
    } catch (error) {
      console.error('Failed to fetch current cycle:', error);
      set({ currentCycle: null });
    }
  },

  startCycle: async (startDate: string, flow?: string, symptoms?: string[]) => {
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

  endCycle: async (id: string, endDate: string) => {
    const { viewingClientId } = (await import('./coachStore')).useCoachStore.getState();
    if (viewingClientId) return;

    try {
      const updatedCycle = await cycleService.updateCycle(id, { cycleEndDate: endDate });
      set((state) => ({
        cycles: state.cycles.map((c) => (c.id === id ? updatedCycle : c)),
        currentCycle: null,
      }));
    } catch (error) {
      console.error('Failed to end cycle:', error);
      throw error;
    }
  },
}));