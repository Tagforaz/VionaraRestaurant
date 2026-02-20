import { apiClient } from '../client';

const BASE_URL = '/api/products';

// ========== DTOs ==========
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

// ========== API Functions ==========
export const getProducts = async (page: number = 1, take: number = 10): Promise<GetProductListItemDto[]> => {
  const res = await apiClient.get(`${BASE_URL}`, {
    params: { page, take },
  });
  return res.data;
};

export const getProduct = async (id: string): Promise<GetProductDto> => {
  const res = await apiClient.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createProduct = async (data: PostProductDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description);
  formData.append('Price', data.price.toString());
  formData.append('CategoryId', data.categoryId);
  formData.append('IsAvailable', data.isAvailable.toString());
  if (data.imageFile) {
    formData.append('ImageFile', data.imageFile);
  }

  const res = await apiClient.post(BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const updateProduct = async (id: string, data: PutProductDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description);
  formData.append('Price', data.price.toString());
  formData.append('CategoryId', data.categoryId);
  formData.append('IsAvailable', data.isAvailable.toString());
  if (data.imageFile) {
    formData.append('ImageFile', data.imageFile);
  }

  const res = await apiClient.put(`${BASE_URL}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteProduct = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteProduct = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};

export const getSoftDeletedProducts = async (page: number = 1, take: number = 10): Promise<GetSoftDeletedProductDto[]> => {
  const res = await apiClient.get(`${BASE_URL}/soft-deleted`, {
    params: { page, take },
  });
  return res.data;
};

export const restoreProduct = async (id: string) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/restore`, null);
  return res.data;
};
