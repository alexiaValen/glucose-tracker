import { api } from '../config/api';
import { GlucoseReading, GlucoseStats, CreateGlucoseRequest } from '../types/glucose';

export const glucoseService = {
  async getReadings(limit = 50, offset = 0): Promise<{ readings: GlucoseReading[] }> {
    const response = await api.get('/glucose', {
      params: { limit, offset },
    });
    return response.data;
  },

  async createReading(data: CreateGlucoseRequest): Promise<GlucoseReading> {
    const response = await api.post('/glucose', data);
    return response.data;
  },

  async deleteReading(id: string): Promise<void> {
    await api.delete(`/glucose/${id}`);
  },

  async getStats(startDate?: string, endDate?: string): Promise<GlucoseStats> {
    const response = await api.get('/glucose/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getChartData(startDate?: string, endDate?: string, interval: 'hour' | 'day' = 'day') {
    const response = await api.get('/glucose/chart', {
      params: { startDate, endDate, interval },
    });
    return response.data;
  },
};