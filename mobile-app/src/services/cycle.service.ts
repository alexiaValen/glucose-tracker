// mobile-app/src/services/cycle.service.ts
// Event-based cycle service.
// Existing methods preserved exactly.
// New: logEvent / getEvents — designed for /cycle/events endpoint (graceful if not yet live).

import { api } from '../config/api';
import {
  CycleLog,
  CreateCycleRequest,
  UpdateCycleRequest,
  CycleEvent,
} from '../types/cycle';

export const cycleService = {
  // ── Existing methods (unchanged) ──────────────────────────────────────────

  async getCycles(limit = 12): Promise<CycleLog[]> {
    const response = await api.get('/cycle', { params: { limit } });
    return response.data.cycles;
  },

  async getCurrentCycle(): Promise<CycleLog | null> {
    const response = await api.get('/cycle/current');
    return response.data.cycle;
  },

  async logCycleStart(startDate: string): Promise<CycleLog> {
    const response = await api.post('/cycle', { cycleStartDate: startDate });
    return response.data;
  },

  async createCycle(data: CreateCycleRequest): Promise<CycleLog> {
    const response = await api.post('/cycle', data);
    return response.data;
  },

  async updateCycle(id: string, data: UpdateCycleRequest): Promise<CycleLog> {
    const response = await api.patch(`/cycle/${id}`, data);
    return response.data;
  },

  async getPrediction(): Promise<{
    predictedStart: string;
    predictedEnd: string;
    avgCycleLength?: number;
  }> {
    const response = await api.get('/cycle/predict');
    return response.data;
  },

  // ── Event-based methods (new) ──────────────────────────────────────────────

  /**
   * POST /cycle/events
   * Logs a single day's bleeding + symptoms to the server.
   * Gracefully no-ops if the endpoint isn't live yet — local state carries the data.
   */
  async logEvent(event: CycleEvent): Promise<CycleEvent | null> {
    try {
      const response = await api.post('/cycle/events', event);
      return response.data;
    } catch {
      // Backend endpoint not yet available — local AsyncStorage handles persistence
      return null;
    }
  },

  /**
   * GET /cycle/events?cycleId=...
   * Fetches server-side event history for a cycle.
   * Returns empty array if endpoint not available.
   */
  async getEvents(cycleId?: string): Promise<CycleEvent[]> {
    try {
      const response = await api.get('/cycle/events', {
        params: cycleId ? { cycleId } : undefined,
      });
      return response.data.events ?? [];
    } catch {
      return [];
    }
  },
};
