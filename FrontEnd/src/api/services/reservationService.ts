import { apiClient } from '../client';
import type { 
  Reservation, 
  CreateReservationDto, 
  UpdateReservationDto 
} from '@/types';

export const reservationService = {
  /**
   * Get all reservations with pagination
   */
  getAll: async (page: number = 1, take: number = 10): Promise<Reservation[]> => {
    const response = await apiClient.get('/reservations', {
      params: { page, take }
    });
    return response.data;
  },

  /**
   * Get reservation by ID
   */
  getById: async (id: string): Promise<Reservation> => {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data;
  },

  /**
   * Create new reservation
   */
  create: async (data: CreateReservationDto): Promise<{ message: string }> => {
    const response = await apiClient.post('/reservations', data);
    return response.data;
  },

  /**
   * Update reservation
   */
  update: async (id: string, data: UpdateReservationDto): Promise<{ message: string }> => {
    const response = await apiClient.put(`/reservations/${id}`, data);
    return response.data;
  },

  /**
   * Delete reservation
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/reservations/${id}`);
    return response.data;
  },
};
    const response = await apiClient.patch<ApiResponse<Reservation>>(`/reservation/${id}/status`, {
      status,
    });
    return response.data;
  },

  async cancelReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.patch<ApiResponse<Reservation>>(`/reservation/${id}/cancel`);
    return response.data;
  },
};
