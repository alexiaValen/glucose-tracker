// src/stores/coachStore.ts
import { create } from 'zustand';
import { coachService, ClientSummary } from '../services/coach.service';

interface CoachState {
  clients: ClientSummary[];
  selectedClient: ClientSummary | null;
  isLoading: boolean;
  fetchClients: () => Promise<void>;
  selectClient: (client: ClientSummary) => void;
  clearSelectedClient: () => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,

  fetchClients: async () => {
    set({ isLoading: true });
    try {
      const clients = await coachService.getClients();
      set({ clients, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      set({ isLoading: false });
    }
  },

  selectClient: (client: ClientSummary) => {
    set({ selectedClient: client });
  },

  clearSelectedClient: () => {
    set({ selectedClient: null });
  },
}));