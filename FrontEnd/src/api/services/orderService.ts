import apiClient from '../client';
import { Order, OrderStatus, ApiResponse, PaginatedResponse, CartItem } from '@/types';

interface CreateOrderRequest {
  items: CartItem[];
  type: 'pickup' | 'delivery';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  couponCode?: string;
  specialInstructions?: string;
}

export const orderService = {
  async getOrders(params?: {
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<PaginatedResponse<Order>>('/order', { params });
    return response.data;
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/order/${id}`);
    return response.data;
  },

  async getMyOrders(): Promise<ApiResponse<Order[]>> {
    const response = await apiClient.get<ApiResponse<Order[]>>('/order/my-orders');
    return response.data;
  },

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>('/order', data);
    return response.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    const response = await apiClient.patch<ApiResponse<Order>>(`/order/${id}/status`, { status });
    return response.data;
  },

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.patch<ApiResponse<Order>>(`/order/${id}/cancel`);
    return response.data;
  },

  async getOrderTracking(id: string): Promise<ApiResponse<{
    status: OrderStatus;
    estimatedTime: string;
    updates: Array<{ status: string; timestamp: string; message: string }>;
  }>> {
    const response = await apiClient.get(`/order/${id}/tracking`);
    return response.data;
  },
};
