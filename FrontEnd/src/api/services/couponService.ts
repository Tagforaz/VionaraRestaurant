import apiClient from '../client';
import { Coupon, ApiResponse } from '@/types';

export const couponService = {
  async validateCoupon(code: string, orderTotal: number): Promise<ApiResponse<{
    valid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    message?: string;
  }>> {
    const response = await apiClient.post('/coupon/validate', { code, orderTotal });
    return response.data;
  },

  async getCoupons(): Promise<ApiResponse<Coupon[]>> {
    const response = await apiClient.get<ApiResponse<Coupon[]>>('/coupon');
    return response.data;
  },

  async getCouponById(id: string): Promise<ApiResponse<Coupon>> {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/coupon/${id}`);
    return response.data;
  },

  async createCoupon(data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    const response = await apiClient.post<ApiResponse<Coupon>>('/coupon', data);
    return response.data;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    const response = await apiClient.put<ApiResponse<Coupon>>(`/coupon/${id}`, data);
    return response.data;
  },

  async deleteCoupon(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/coupon/${id}`);
    return response.data;
  },
};
