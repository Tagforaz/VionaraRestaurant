import { apiClient } from '../client';

const BASE_URL = '/api/tables';

// Types matching backend DTOs
export type GetTableDto = {
  id: string;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
  createdAt?: string;
  positionX?: number;
  positionY?: number;
  rotation?: number | null;
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
  positionX?: number;
  positionY?: number;
  rotation?: number | null;
};

export const getTables = async () => {
  const res = await apiClient.get<GetTableDto[]>(BASE_URL);
  return res.data;
};

export const getTableById = async (id: string) => {
  const res = await apiClient.get<GetTableDto>(`${BASE_URL}/${id}`);
  return res.data;
};

export const createTable = async (data: PostTableDto) => {
  const payload = {
    TableNumber: data.tableNumber,
    Capacity: data.capacity,
  };
  const res = await apiClient.post(BASE_URL, payload);
  return res.data;
};

export const updateTable = async (id: string, data: PutTableDto) => {
  const payload = {
    TableNumber: data.tableNumber,
    Capacity: data.capacity,
    IsAvailable: data.isAvailable,
  };
  const res = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return res.data;
};

export const deleteTable = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const getAvailableTables = async (date?: string, time?: string, partySize?: number) => {
  const params: Record<string, any> = {};
  if (date) params.date = date;
  if (time) params.time = time;
  if (partySize) params.partySize = partySize;
  const res = await apiClient.get<GetAvailableTableDto[]>(`${BASE_URL}/available`, { params });
  return res.data;
};
