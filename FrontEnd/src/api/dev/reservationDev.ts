import { apiClient } from '../client';

const BASE_URL = '/api/reservations';

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export type GetReservationDto = {
  id: string;
  userId: string;
  tableId?: string | null;
  tableNumber?: number | null;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus | number;
  specialRequests?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt?: string;
};

export type PostReservationDto = {
  userId: string;
  tableId?: string | null;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm:ss
  partySize: number;
  specialRequests?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type PutReservationDto = {
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
};

export const getReservations = async (page = 1, take = 10) => {
  const res = await apiClient.get<GetReservationDto[]>(BASE_URL, { params: { page, take } });
  return res; // return full Axios response to allow callers to inspect paging or data shape
};

export const getReservationById = async (id: string | number) => {
  const res = await apiClient.get<GetReservationDto>(`${BASE_URL}/${id}`);
  return res.data;
};

export const createReservation = async (data: PostReservationDto) => {
  const payload = {
    UserId: data.userId,
    ...(data.tableId && { TableId: data.tableId }),
    Date: data.date,
    Time: data.time,
    PartySize: data.partySize,
    ...(data.specialRequests && { SpecialRequests: data.specialRequests }),
    CustomerName: data.customerName,
    CustomerEmail: data.customerEmail,
    CustomerPhone: data.customerPhone,
  };
  const res = await apiClient.post(BASE_URL, payload);
  return res.data;
};

export const updateReservation = async (id: string | number, data: PutReservationDto) => {
  const payload: any = {
    Date: data.date,
    Time: data.time,
    PartySize: data.partySize,
    Status: data.status,
  };
  if (data.specialRequests) payload.SpecialRequests = data.specialRequests;
  const res = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return res.data;
};

export const deleteReservation = async (id: string | number) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};
