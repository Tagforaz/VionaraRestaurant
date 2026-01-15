import apiClient from '../client';
import { User, ApiResponse } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },
};
