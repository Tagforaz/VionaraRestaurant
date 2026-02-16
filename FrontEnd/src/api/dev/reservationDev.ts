import { apiClient } from '../client';

const BASE_URL = '/Reservations';

// Types matching backend DTOs
export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export type GetReservationDto = {
  id: string;
  userId: string;
  tableId?: string;
  tableNumber?: number;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
};

export type PostReservationDto = {
  userId: string;
  tableId?: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
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

export const getReservations = async () => {
  const res = await apiClient.get<GetReservationDto[]>(BASE_URL);
  return res;
};

export const getReservationById = async (id: number | string) => {
  const res = await apiClient.get<GetReservationDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createReservation = async (data: PostReservationDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    UserId: data.userId,
    ...(data.tableId && { TableId: data.tableId }),
    Date: data.date,
    Time: data.time,
    PartySize: data.partySize,
    ...(data.specialRequests && { SpecialRequests: data.specialRequests }),
    CustomerName: data.customerName,
    CustomerEmail: data.customerEmail,
    CustomerPhone: data.customerPhone
  };
  const res = await apiClient.post(BASE_URL, payload);
  return res;
};

export const updateReservation = async (id: number | string, data: PutReservationDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    Date: data.date,
    Time: data.time,
    PartySize: data.partySize,
    Status: data.status,
    ...(data.specialRequests && { SpecialRequests: data.specialRequests })
  };
  const res = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return res;
};

export const deleteReservation = async (id: number | string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res;
};
