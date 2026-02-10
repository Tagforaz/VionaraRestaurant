import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Couriers';

// Enums matching backend
export type VehicleType = 'Bicycle' | 'Motorcycle' | 'Car';
export type CourierStatus = 'Pending' | 'Approved' | 'Active' | 'Suspended';

// Types matching backend DTOs
export type GetCourierDto = {
  id: string;
  userId: string;
  userFullName: string;
  vehicleType: VehicleType;
  status: CourierStatus;
  imageUrl?: string;
  averageRating: number;
  completedDeliveries: number;
  isAvailable: boolean;
  createdAt: string;
};

export type GetCourierListItemDto = {
  id: string;
  userFullName: string;
  imageUrl?: string;
  status: CourierStatus;
  isAvailable: boolean;
};

export type PostCourierDto = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  vehicleType: VehicleType;
};

export type PutCourierDto = {
  vehicleType: VehicleType;
  status: CourierStatus;
  isAvailable: boolean;
};

export const getCouriers = async () => {
  const res = await axios.get<GetCourierDto[]>(BASE_URL);
  return res;
};

export const getCourier = async (id: string) => {
  const res = await axios.get<GetCourierDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createCourier = async (data: PostCourierDto, imageFile?: File) => {
  const formData = new FormData();
  formData.append('FirstName', data.firstName);
  formData.append('LastName', data.lastName);
  formData.append('Email', data.email);
  formData.append('PhoneNumber', data.phoneNumber);
  formData.append('Password', data.password);
  formData.append('VehicleType', data.vehicleType);
  if (imageFile) {
    formData.append('ImageFile', imageFile);
  }
  const res = await axios.post(BASE_URL, formData);
  return res;
};

export const updateCourier = async (id: string, data: PutCourierDto, imageFile?: File) => {
  const formData = new FormData();
  formData.append('VehicleType', data.vehicleType);
  formData.append('Status', data.status);
  formData.append('IsAvailable', data.isAvailable ? 'true' : 'false');
  if (imageFile) {
    formData.append('ImageFile', imageFile);
  }
  const res = await axios.put(`${BASE_URL}/${id}`, formData);
  return res;
};

export const deleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res;
};

export const softDeleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}/soft-delete`);
  return res;
};
