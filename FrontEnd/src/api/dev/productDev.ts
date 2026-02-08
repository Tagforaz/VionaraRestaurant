import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Products';

export const getProducts = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const getProduct = async (id: string) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createProduct = async (data: FormData | any) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateProduct = async (id: string, data: FormData | any) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteProduct = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};
