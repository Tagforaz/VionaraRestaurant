import { apiClient } from '../client';

const BASE_URL = '/Tables';

// Types matching backend DTOs
export type GetTableDto = {
  id: string;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
  createdAt: string;
};

export type PostTableDto = {
  tableNumber: number;
  capacity: number;
};

export type PutTableDto = {
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
};

export type GetAvailableTableDto = {
  id: string;
  tableNumber: number;
  capacity: number;
  isBooked: boolean;
};

export const getTables = async () => {
  const res = await apiClient.get<GetTableDto[]>(BASE_URL);
  return res;
};

export const getTableById = async (id: string) => {
  const res = await apiClient.get<GetTableDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createTable = async (data: PostTableDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    TableNumber: data.tableNumber,
    Capacity: data.capacity
  };
  const res = await apiClient.post(BASE_URL, payload);
  return res;
};

export const updateTable = async (id: string, data: PutTableDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    TableNumber: data.tableNumber,
    Capacity: data.capacity,
    IsAvailable: data.isAvailable
  };
  const res = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return res;
};

export const deleteTable = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res;
};

export const getAvailableTables = async () => {
  const res = await apiClient.get<GetAvailableTableDto[]>(`${BASE_URL}/available`);
  return res;
};
