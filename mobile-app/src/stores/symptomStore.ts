// mobile-app/src/stores/symptomStore.ts
import { create } from 'zustand';
import { Symptom } from '../types/symptom';
import { symptomService } from '../services/symptom.service';
import { useAuthStore } from './authStore';
import { getActiveUserId } from './coachStore';
import { api } from '../config/api';

interface SymptomState {
  symptoms: Symptom[];
  isLoading: boolean;
  fetchSymptoms: () => Promise<void>;
  addSymptom: (symptomType: string, severity: number, notes?: string, glucoseReadingId?: string) => Promise<void>;
  deleteSymptom: (id: string) => Promise<void>;
}

export const useSymptomStore = create<SymptomState>((set) => ({
  symptoms: [],
  isLoading: false,

  fetchSymptoms: async () => {
    set({ isLoading: true });
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id);
      const isViewingClient = useAuthStore.getState().user?.role === 'coach'
        && !!userId && userId !== useAuthStore.getState().user?.id;

      let symptoms: Symptom[] = [];

      if (isViewingClient) {
        const response = await api.get(`/coach/clients/${userId}/symptoms`, {
          params: { limit: 50 },
        });
        symptoms = response.data?.symptoms ?? response.data ?? [];
      } else {
        symptoms = await symptomService.getSymptoms(50, 0);
      }

      set({ symptoms: Array.isArray(symptoms) ? symptoms : [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
      set({ isLoading: false });
    }
  },

  addSymptom: async (symptomType: string, severity: number, notes?: string, glucoseReadingId?: string) => {
    const { viewingClientId } = (await import('./coachStore')).useCoachStore.getState();
    if (viewingClientId) return; // read-only when previewing

    set({ isLoading: true });
    try {
      const newSymptom = await symptomService.createSymptom({
        symptomType,
        severity,
        notes,
        glucoseReadingId,
      });
      set((state) => ({
        symptoms: [newSymptom, ...state.symptoms],
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteSymptom: async (id: string) => {
    const { viewingClientId } = (await import('./coachStore')).useCoachStore.getState();
    if (viewingClientId) return;

    try {
      await symptomService.deleteSymptom(id);
      set((state) => ({
        symptoms: state.symptoms.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete symptom:', error);
      throw error;
    }
  },
}));