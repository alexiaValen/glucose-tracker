// src/services/coach.service.ts
import { api } from '../config/api';

export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastActive: string;
  recentStats: {
    avgGlucose: number;
    lastReading: number;
    timeInRange: number;
  };
}

export interface ClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Normalize the backend's snake_case response to the camelCase shape the app expects
function normalizeClient(c: any): ClientSummary {
  return {
    id: c.id,
    firstName: c.first_name ?? c.firstName ?? '',
    lastName: c.last_name ?? c.lastName ?? '',
    email: c.email ?? '',
    lastActive: c.last_reading_at ?? c.lastActive ?? c.created_at ?? '',
    recentStats: {
      avgGlucose: c.recent_stats?.avg_glucose ?? c.recentStats?.avgGlucose ?? 0,
      lastReading: c.recent_stats?.last_reading ?? c.recentStats?.lastReading ?? 0,
      timeInRange: c.recent_stats?.time_in_range ?? c.recentStats?.timeInRange ?? 0,
    },
  };
}

export const coachService = {
  async getClients(): Promise<ClientSummary[]> {
    const response = await api.get('/coach/clients');
    const raw: any[] = response.data.clients ?? response.data ?? [];
    return raw.map(normalizeClient);
  },

  async addClient(email: string): Promise<ClientSummary> {
    const response = await api.post('/coach/clients', { email });
    return normalizeClient(response.data.client);
  },

  async removeClient(clientId: string): Promise<void> {
    await api.delete(`/coach/clients/${clientId}`);
  },

  async editClient(clientId: string, updates: { firstName?: string; lastName?: string; phone?: string }): Promise<ClientSummary> {
    const response = await api.patch(`/coach/clients/${clientId}`, updates);
    return normalizeClient(response.data.client);
  },

  async getClientGlucose(clientId: string, limit = 50) {
    const response = await api.get(`/coach/clients/${clientId}/glucose`, {
      params: { limit },
    });
    return response.data.readings ?? response.data;
  },

  async getClientStats(clientId: string, startDate?: string, endDate?: string) {
    const response = await api.get(`/coach/clients/${clientId}/stats`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getClientSymptoms(clientId: string, limit = 50) {
    const response = await api.get(`/coach/clients/${clientId}/symptoms`, {
      params: { limit },
    });
    return response.data.symptoms ?? response.data;
  },

  async getClientCycle(clientId: string) {
    const response = await api.get(`/coach/clients/${clientId}/cycle`);
    return response.data;
  },
};