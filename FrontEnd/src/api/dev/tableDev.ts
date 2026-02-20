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
  positionX?: number;
  positionY?: number;
  rotation?: number | null;
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

/** Backend validasiya: PositionX, PositionY 0–100 (inclusive), mənfi olmamalıdır */
const CLAMP_POS = (v: number) => Math.max(0, Math.min(100, Number(v) || 0));
/** Rotation 0–360 */
const CLAMP_ROTATION = (v: number) => Math.max(0, Math.min(360, Math.round(Number(v) || 0)));

export const updateTable = async (id: string, data: PutTableDto) => {
  const payload = {
    TableNumber: Math.round(Number(data.tableNumber)),
    Capacity: Math.round(Number(data.capacity)),
    IsAvailable: Boolean(data.isAvailable),
    PositionX: CLAMP_POS(data.positionX ?? 0),
    PositionY: CLAMP_POS(data.positionY ?? 0),
    Rotation: CLAMP_ROTATION(data.rotation ?? 0),
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
