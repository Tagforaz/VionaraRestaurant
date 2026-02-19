import apiClient from '../client';
import { Category, Product, ApiResponse, PaginatedResponse } from '@/types';

export const menuService = {
  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/api/categories');
    return response.data;
  },

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await apiClient.get<ApiResponse<Category>>(`/api/categories/${id}`);
    return response.data;
  },

  async createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await apiClient.post<ApiResponse<Category>>('/api/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await apiClient.put<ApiResponse<Category>>(`/api/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/categories/${id}`);
    return response.data;
  },

  // Products
  async getProducts(params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/menu/products', { params });
    return response.data;
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(`/menu/products/${id}`);
    return response.data;
  },

  async getPopularProducts(): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/menu/products/popular');
    return response.data;
  },

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await apiClient.post<ApiResponse<Product>>('/menu/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    const response = await apiClient.put<ApiResponse<Product>>(`/menu/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/menu/products/${id}`);
    return response.data;
  },

  async uploadProductImage(id: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
      `/menu/products/${id}/image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};
