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

export const coachService = {
  async getClients(): Promise<ClientSummary[]> {
    const response = await api.get('/coach/clients');
    return response.data.clients || response.data;
  },

  async getClientGlucose(clientId: string, limit = 50) {
    const response = await api.get(`/coach/clients/${clientId}/glucose`, {
      params: { limit },
    });
    return response.data.readings || response.data;
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
    return response.data.symptoms || response.data;
  },

  async getClientCycle(clientId: string) {
    const response = await api.get(`/coach/clients/${clientId}/cycle`);
    return response.data;
  },
};