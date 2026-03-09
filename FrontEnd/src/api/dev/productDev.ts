import api from '../axiosInstance';

const BASE_URL = '/api/products';

export interface GetProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface GetProductListItemDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  createdAt?: string;
}

export interface GetSoftDeletedProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryName: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PostProductDto {
  name: string;
  description: string;
  price: number;
  imageFile?: File;
  categoryId: string;
  isAvailable: boolean;
}

export interface PutProductDto {
  name: string;
  description: string;
  price: number;
  imageFile?: File;
  categoryId: string;
  isAvailable: boolean;
}

export const getProducts = async (page: number = 1, take: number = 10): Promise<GetProductListItemDto[]> => {
  const res = await api.get(BASE_URL, { params: { page, take } });
  return res.data;
};

export const getProduct = async (id: string): Promise<GetProductDto> => {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const getAllProducts = async (page = 1, take = 100): Promise<GetProductListItemDto[]> => {
  const res = await api.get(BASE_URL, { params: { page, take } });
  return res.data?.data || res.data || [];
};

export const createProduct = async (data: PostProductDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description);
  formData.append('Price', data.price.toString());
  formData.append('CategoryId', data.categoryId);
  formData.append('IsAvailable', data.isAvailable.toString());
  if (data.imageFile) formData.append('ImageFile', data.imageFile);
  const res = await api.post(BASE_URL, formData);
  return res.data;
};

export const updateProduct = async (id: string, data: PutProductDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description);
  formData.append('Price', data.price.toString());
  formData.append('CategoryId', data.categoryId);
  formData.append('IsAvailable', data.isAvailable.toString());
  if (data.imageFile) formData.append('ImageFile', data.imageFile);
  const res = await api.put(`${BASE_URL}/${id}`, formData);
  return res.data;
};

export const deleteProduct = async (id: string) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteProduct = async (id: string) => {
  const res = await api.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};

export const getSoftDeletedProducts = async (page: number = 1, take: number = 10): Promise<GetSoftDeletedProductDto[]> => {
  const res = await api.get(`${BASE_URL}/soft-deleted`, { params: { page, take } });
  return res.data;
};

export const restoreProduct = async (id: string) => {
  const res = await api.post(`${BASE_URL}/${id}/restore`, null);
  return res.data;
};

// Köhnə fayllarla uyğunluq üçün
export interface CategoryDto {
  id: string;
  name: string;
}

export const getCategoriesForDropdown = async (): Promise<CategoryDto[]> => {
  const res = await api.get('/api/categories/dropdown');
  return res.data;
};
