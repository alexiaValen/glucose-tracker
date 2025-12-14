import { create } from 'zustand';
import { Symptom } from '../types/symptom';
import { symptomService } from '../services/symptom.service';

interface SymptomState {
  symptoms: Symptom[];
  isLoading: boolean;
  fetchSymptoms: () => Promise<void>;
  addSymptom: (symptomType: string, severity: number, notes?: string, glucoseReadingId?: string) => Promise<void>;
  deleteSymptom: (id: string) => Promise<void>;
}

export const useSymptomStore = create<SymptomState>((set, get) => ({
  symptoms: [],
  isLoading: false,

  fetchSymptoms: async () => {
    set({ isLoading: true });
    try {
      const symptoms = await symptomService.getSymptoms(50, 0);
      set({ symptoms, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
      set({ isLoading: false });
    }
  },

  addSymptom: async (symptomType: string, severity: number, notes?: string, glucoseReadingId?: string) => {
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