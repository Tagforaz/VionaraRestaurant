import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Couriers';

export const getCouriers = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const getCourier = async (id: string) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createCourier = async (data: FormData | any) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateCourier = async (id: string, data: FormData | any) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const deleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteCourier = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};
