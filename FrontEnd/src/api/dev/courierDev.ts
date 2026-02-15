import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Couriers';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Enums matching backend
export enum VehicleType {
  Bike = 1,
  Scooter = 2,
  Motorcycle = 3,
  Car = 4
}

export enum CourierStatus {
  Available = 1,
  Busy = 2,
  Offline = 3
}

// DTOs matching backend
export interface GetCourierDto {
  id: string;
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber?: string;
  vehicleType: VehicleType;
  status: CourierStatus;
  imageUrl?: string;
  averageRating: number;
  completedDeliveries: number;
  ongoingDeliveries: number;
  totalDeliveries: number;
  isAvailable: boolean;
  lastDeliveryDate?: string;
  createdAt: string;
}

export interface GetCourierListItemDto {
  id: string;
  userFullName: string;
  imageUrl?: string;
  vehicleType: VehicleType;
  status: CourierStatus;
  isAvailable: boolean;
  completedDeliveries: number;
  averageRating: number;
}

export interface GetSoftDeletedCourierDto {
  id: string;
  userFullName: string;
  email: string;
  vehicleType: VehicleType;
  imageUrl?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PostCourierDto {
  userId: string;
  vehicleType: VehicleType;
  imageFile?: File;
}

export interface PutCourierDto {
  vehicleType: VehicleType;
  status: CourierStatus;
  isAvailable: boolean;
  imageFile?: File;
}

export interface PagedResult<T> {
  page: number;
  take: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

// API Functions
export const getCouriers = async (page: number = 1, take: number = 10) => {
  const res = await axios.get<PagedResult<GetCourierListItemDto>>(`${BASE_URL}?page=${page}&take=${take}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getCourier = async (id: string) => {
  const res = await axios.get<GetCourierDto>(`${BASE_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createCourier = async (data: PostCourierDto) => {
  const formData = new FormData();
  formData.append('UserId', data.userId);
  formData.append('VehicleType', data.vehicleType.toString());
  if (data.imageFile) {
    formData.append('ImageFile', data.imageFile);
  }
  
  const res = await axios.post(BASE_URL, formData, {
    headers: {
      ...getAuthHeaders(),
      // Don't set Content-Type - let browser set it with boundary
    },
  });
  return res.data;
};

export const updateCourier = async (id: string, data: PutCourierDto) => {
  const formData = new FormData();
  formData.append('VehicleType', data.vehicleType.toString());
  formData.append('Status', data.status.toString());
  formData.append('IsAvailable', data.isAvailable ? 'true' : 'false');
  if (data.imageFile) {
    formData.append('ImageFile', data.imageFile);
  }
  
  const res = await axios.put(`${BASE_URL}/${id}`, formData, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const softDeleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}/soft-delete`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getSoftDeletedCouriers = async (page: number = 1, take: number = 10) => {
  const res = await axios.get<PagedResult<GetSoftDeletedCourierDto>>(
    `${BASE_URL}/soft-deleted?page=${page}&take=${take}`,
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export const restoreCourier = async (id: string) => {
  const res = await axios.post(`${BASE_URL}/${id}/restore`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Helper functions
export const getVehicleTypeLabel = (type: VehicleType): string => {
  switch (type) {
    case 0: return 'Velosiped';
    case 1: return 'Motosiklet';
    case 2: return 'Avtomobil';
    default: return 'Naməlum';
  }
};

export const getCourierStatusLabel = (status: CourierStatus): string => {
  switch (status) {
    case 1: return 'Mövcud';
    case 2: return 'Məşğul';
    case 3: return 'Oflayn';
    default: return 'Naməlum';
  }
};

export const getCourierStatusColor = (status: CourierStatus): string => {
  switch (status) {
    case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 3: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};
