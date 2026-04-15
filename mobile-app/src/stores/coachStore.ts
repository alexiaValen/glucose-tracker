// mobile-app/src/stores/coachStore.ts
import { create } from 'zustand';
import { coachService, ClientSummary } from '../services/coach.service';

interface CoachState {
  clients: ClientSummary[];
  selectedClient: ClientSummary | null;
  isLoading: boolean;

  // Real preview system
  viewingClientId: string | null;
  viewingClientName: string | null;

  fetchClients: () => Promise<void>;
  addClient: (email: string) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  editClient: (clientId: string, updates: { firstName?: string; lastName?: string; phone?: string }) => Promise<void>;
  selectClient: (client: ClientSummary) => void;
  clearSelectedClient: () => void;
  setViewingClient: (clientId: string, clientName: string) => void;
  clearViewingClient: () => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  viewingClientId: null,
  viewingClientName: null,

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

  addClient: async (email: string) => {
    const newClient = await coachService.addClient(email);
    set(state => ({ clients: [...state.clients, newClient] }));
  },

  removeClient: async (clientId: string) => {
    await coachService.removeClient(clientId);
    set(state => ({ clients: state.clients.filter(c => c.id !== clientId) }));
  },

  editClient: async (clientId: string, updates) => {
    const updated = await coachService.editClient(clientId, updates);
    set(state => ({
      clients: state.clients.map(c => c.id === clientId ? { ...c, ...updated } : c),
    }));
  },

  selectClient: (client: ClientSummary) => {
    set({ selectedClient: client });
  },

  clearSelectedClient: () => {
    set({ selectedClient: null });
  },

  setViewingClient: (clientId: string, clientName: string) => {
    set({ viewingClientId: clientId, viewingClientName: clientName });
  },

  clearViewingClient: () => {
    set({ viewingClientId: null, viewingClientName: null });
  },
}));

// ─── Selector: returns the active user ID for data fetching ───────────────────
// Usage in any store or screen:
//   import { getActiveUserId } from '../stores/coachStore';
//   const userId = getActiveUserId(useAuthStore.getState().user?.id);
export function getActiveUserId(loggedInUserId: string | undefined): string | undefined {
  const { viewingClientId } = useCoachStore.getState();
  return viewingClientId ?? loggedInUserId;
}