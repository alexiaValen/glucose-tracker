// // mobile-app/src/services/cycle.service.ts
// import { api } from '../config/api';

// export interface CycleLog {
//   id: string;
//   user_id: string;
//   start_date: string;
//   end_date?: string;
//   cycle_length?: number;
//   notes?: string;
//   created_at: string;


// cycle_start_date: string;  // ✅ Matches backend
//   cycle_end_date?: string;   // ✅ Matches backend
//   current_day: number;       // ✅ Added
//   phase: string;    
// }

// export interface CreateCycleRequest {
//   start_date: string;
//   notes?: string;
// }

// export const cycleService = {
//   /**
//    * Log the start of a new menstrual cycle
//    */
//   async logCycleStart(startDate: string): Promise<CycleLog> {
//     const response = await api.post('/cycles', {
//       start_date: startDate,
//     });
//     return response.data;
//   },

//   /**
//    * Get cycle history
//    */
//   async getCycles(limit = 12): Promise<{ cycles: CycleLog[] }> {
//     const response = await api.get('/cycles', {
//       params: { limit },
//     });
//     return response.data;
//   },

//   /**
//    * Get current cycle
//    */
//   async getCurrentCycle(): Promise<CycleLog | null> {
//     const response = await api.get('/cycles/current');
//     return response.data;
//   },

//   /**
//    * Update cycle end date
//    */
//   async updateCycle(id: string, data: { end_date?: string; notes?: string }): Promise<CycleLog> {
//     const response = await api.patch(`/cycles/${id}`, data);
//     return response.data;
//   },

//   /**
//    * Delete a cycle log
//    */
//   async deleteCycle(id: string): Promise<void> {
//     await api.delete(`/cycles/${id}`);
//   },

//   /**
//    * Get cycle statistics
//    */
//   async getCycleStats(): Promise<{
//     average_length: number;
//     last_cycle_length?: number;
//     predicted_next_start?: string;
//   }> {
//     const response = await api.get('/cycles/stats');
//     return response.data;
//   },
// };

// mobile-app/src/services/cycle.service.ts
import { api } from '../config/api';
import { CycleLog, CreateCycleRequest, UpdateCycleRequest } from '../types/cycle';

export const cycleService = {
  /**
   * Get cycle history
   */
  async getCycles(limit = 12): Promise<CycleLog[]> {
    const response = await api.get('/cycle', {
      params: { limit },
    });
    return response.data.cycles;
  },

  /**
   * Get current active cycle
   */
  async getCurrentCycle(): Promise<CycleLog | null> {
    const response = await api.get('/cycle/current');
    return response.data.cycle;
  },

  /**
   * Log the start of a new menstrual cycle
   */
  async logCycleStart(startDate: string): Promise<CycleLog> {
    const response = await api.post('/cycle', {
      cycleStartDate: startDate,
    });
    return response.data;
  },

  /**
   * Create a new cycle with details
   */
  async createCycle(data: CreateCycleRequest): Promise<CycleLog> {
    const response = await api.post('/cycle', data);
    return response.data;
  },

  /**
   * Update cycle (usually to end it)
   */
  async updateCycle(id: string, data: UpdateCycleRequest): Promise<CycleLog> {
    const response = await api.patch(`/cycle/${id}`, data);
    return response.data;
  },

  /**
   * Get cycle predictions
   */
  async getPrediction(): Promise<{
    predictedStart: string;
    predictedEnd: string;
    avgCycleLength?: number;
  }> {
    const response = await api.get('/cycle/predict');
    return response.data;
  },
};