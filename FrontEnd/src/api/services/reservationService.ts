import apiClient from '../client';
import { Reservation, ReservationStatus, TimeSlot, ApiResponse, PaginatedResponse } from '@/types';

interface CreateReservationRequest {
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests?: string;
}

export const reservationService = {
  async getReservations(params?: {
    status?: ReservationStatus;
    date?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Reservation>> {
    const response = await apiClient.get<PaginatedResponse<Reservation>>('/reservation', { params });
    return response.data;
  },

  async getReservationById(id: string): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.get<ApiResponse<Reservation>>(`/reservation/${id}`);
    return response.data;
  },

  async getMyReservations(): Promise<ApiResponse<Reservation[]>> {
    const response = await apiClient.get<ApiResponse<Reservation[]>>('/reservation/my-reservations');
    return response.data;
  },

  async getAvailableSlots(date: string): Promise<ApiResponse<TimeSlot[]>> {
    const response = await apiClient.get<ApiResponse<TimeSlot[]>>('/reservation/available-slots', {
      params: { date },
    });
    return response.data;
  },

  async createReservation(data: CreateReservationRequest): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.post<ApiResponse<Reservation>>('/reservation', data);
    return response.data;
  },

  async updateReservationStatus(
    id: string,
    status: ReservationStatus
  ): Promise<ApiResponse<Reservation>> {
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
