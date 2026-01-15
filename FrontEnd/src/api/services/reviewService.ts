import apiClient from '../client';
import { Review, ApiResponse, PaginatedResponse } from '@/types';

interface CreateReviewRequest {
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
}

export const reviewService = {
  async getReviews(params?: {
    productId?: string;
    isApproved?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>('/review', { params });
    return response.data;
  },

  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    const response = await apiClient.get<ApiResponse<Review[]>>(`/review/product/${productId}`);
    return response.data;
  },

  async getMyReviews(): Promise<ApiResponse<Review[]>> {
    const response = await apiClient.get<ApiResponse<Review[]>>('/review/my-reviews');
    return response.data;
  },

  async createReview(data: CreateReviewRequest): Promise<ApiResponse<Review>> {
    const response = await apiClient.post<ApiResponse<Review>>('/review', data);
    return response.data;
  },

  async updateReview(id: string, data: Partial<CreateReviewRequest>): Promise<ApiResponse<Review>> {
    const response = await apiClient.put<ApiResponse<Review>>(`/review/${id}`, data);
    return response.data;
  },

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/review/${id}`);
    return response.data;
  },

  async approveReview(id: string): Promise<ApiResponse<Review>> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/review/${id}/approve`);
    return response.data;
  },

  async rejectReview(id: string): Promise<ApiResponse<Review>> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/review/${id}/reject`);
    return response.data;
  },
};
