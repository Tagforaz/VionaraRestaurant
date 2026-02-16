import { apiClient } from '../client';
import type { 
  Table, 
  AvailableTable, 
  CreateTableDto, 
  UpdateTableDto 
} from '@/types';

export const tableService = {
  /**
   * Get all tables with pagination
   */
  getAll: async (page: number = 1, take: number = 10): Promise<Table[]> => {
    const response = await apiClient.get('/tables', {
      params: { page, take }
    });
    return response.data;
  },

  /**
   * Get table by ID
   */
  getById: async (id: string): Promise<Table> => {
    const response = await apiClient.get(`/tables/${id}`);
    return response.data;
  },

  /**
   * Get available tables for specific date, time and party size
   */
  getAvailable: async (date: string, time: string, partySize: number): Promise<{
    date: string;
    time: string;
    partySize: number;
    availableTables: AvailableTable[];
  }> => {
    const response = await apiClient.get('/tables/available', {
      params: { date, time, partySize }
    });
    return response.data;
  },

  /**
   * Create new table
   */
  create: async (data: CreateTableDto): Promise<{ message: string; tableId: string }> => {
    const response = await apiClient.post('/tables', data);
    return response.data;
  },

  /**
   * Update table
   */
  update: async (id: string, data: UpdateTableDto): Promise<{ message: string }> => {
    const response = await apiClient.put(`/tables/${id}`, data);
    return response.data;
  },

  /**
   * Delete table
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/tables/${id}`);
    return response.data;
  },
};
