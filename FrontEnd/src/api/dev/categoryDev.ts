import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Categories';

export const getCategories = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const getCategory = async (id: string) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createCategory = async (data: any) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateCategory = async (id: string, data: any) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteCategory = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};
