import { api } from '../config/api';
import { CycleLog, CreateCycleRequest, UpdateCycleRequest } from '../types/cycle';

export const cycleService = {
  async getCycles(limit = 12): Promise<CycleLog[]> {
    const response = await api.get('/cycle', {
      params: { limit },
    });
    return response.data.cycles || response.data;
  },

  async getCurrentCycle(): Promise<CycleLog | null> {
    const response = await api.get('/cycle/current');
    return response.data.cycle || response.data || null;
  },

  async createCycle(data: CreateCycleRequest): Promise<CycleLog> {
    const response = await api.post('/cycle', data);
    return response.data;
  },

  async updateCycle(id: string, data: UpdateCycleRequest): Promise<CycleLog> {
    const response = await api.patch(`/cycle/${id}`, data);
    return response.data;
  },

  async predictNextCycle(): Promise<{ predictedStart: string; predictedEnd: string }> {
    const response = await api.get('/cycle/predict');
    return response.data;
  },
};