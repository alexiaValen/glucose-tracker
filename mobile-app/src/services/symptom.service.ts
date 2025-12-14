import { api } from '../config/api';
import { Symptom, CreateSymptomRequest } from '../types/symptom';

export const symptomService = {
  async getSymptoms(limit = 50, offset = 0): Promise<Symptom[]> {
    const response = await api.get('/symptoms', {
      params: { limit, offset },
    });
    return response.data.symptoms || response.data;
  },

  async createSymptom(data: CreateSymptomRequest): Promise<Symptom> {
    const payload = {
      ...data,
      loggedAt: new Date().toISOString(),
    };
    const response = await api.post('/symptoms', payload);
    return response.data;
  },

  async deleteSymptom(id: string): Promise<void> {
    await api.delete(`/symptoms/${id}`);
  },
};