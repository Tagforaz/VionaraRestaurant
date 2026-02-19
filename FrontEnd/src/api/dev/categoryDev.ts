import { apiClient } from '../client';

const BASE_URL = '/api/categories';

// ========== DTOs ==========
export interface GetCategoryDto {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  productCount: number;
}

export interface GetCategoryItemDto {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  productCount: number;
}

export interface GetCategoryForDropdownDto {
  id: string;
  name: string;
}

export interface GetCategoryInProductDto {
  id: string;
  name: string;
}

export interface GetSoftDeletedCategoryDto {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PostCategoryDto {
  name: string;
  imageFile?: File;
  sortOrder: number;
  isActive?: boolean;
}

export interface PutCategoryDto {
  name: string;
  imageFile?: File;
  sortOrder: number;
  isActive: boolean;
}

// ========== API Functions ==========
export const getCategories = async (page: number = 1, take: number = 10): Promise<GetCategoryItemDto[]> => {
  const res = await apiClient.get(`${BASE_URL}`, {
    params: { page, take },
  });
  return res.data;
};

export const getCategory = async (id: string): Promise<GetCategoryDto> => {
  const res = await apiClient.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const getCategoriesForDropdown = async (): Promise<GetCategoryForDropdownDto[]> => {
  const res = await apiClient.get(`${BASE_URL}/dropdown`);
  return res.data;
};

export const createCategory = async (data: PostCategoryDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('SortOrder', data.sortOrder.toString());
  formData.append('IsActive', (data.isActive ?? true).toString());
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

export const updateCategory = async (id: string, data: PutCategoryDto) => {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('SortOrder', data.sortOrder.toString());
  formData.append('IsActive', data.isActive.toString());
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

export const deleteCategory = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const softDeleteCategory = async (id: string) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}/soft-delete`);
  return res.data;
};

export const getSoftDeletedCategories = async (page: number = 1, take: number = 10): Promise<GetSoftDeletedCategoryDto[]> => {
  const res = await apiClient.get(`${BASE_URL}/soft-deleted`, {
    params: { page, take },
  });
  return res.data;
};

export const restoreCategory = async (id: string) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/restore`, null);
  return res.data;
};
