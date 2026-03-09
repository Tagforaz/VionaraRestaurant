import api from '../axiosInstance';
import { User } from '@/types';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  fullAddress?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface NotificationSettings {
  email: { orderUpdates: boolean; promotions: boolean; newsletter: boolean; };
  push: { orderStatus: boolean; newMessages: boolean; systemAlerts: boolean; };
  sms: { orderConfirmation: boolean; deliveryUpdates: boolean; };
}

interface UserStatistics {
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  averageRating: number;
  totalSpent?: number;
  ordersProcessed?: number;
  deliveriesCompleted?: number;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<any> => {
    const response = await api.put('/api/user/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/authentication/upload-avatar', formData, {
      params: { userId },
    });
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await api.post('/api/user/change-password', data);
    return response.data;
  },

  toggle2FA: async (enabled: boolean): Promise<{ enabled: boolean; qrCode?: string }> => {
    const response = await api.post('/api/user/2fa', { enabled });
    return response.data;
  },

  verify2FA: async (code: string): Promise<{ verified: boolean }> => {
    const response = await api.post('/api/user/2fa/verify', { code });
    return response.data;
  },

  updateNotificationSettings: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    const response = await api.put('/api/user/notifications', settings);
    return response.data;
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get('/api/user/notifications');
    return response.data;
  },

  getUserStatistics: async (): Promise<UserStatistics> => {
    const response = await api.get('/api/user/statistics');
    return response.data;
  },

  getActivityLogs: async (limit = 20): Promise<ActivityLog[]> => {
    const response = await api.get('/api/user/activity', { params: { limit } });
    return response.data;
  },

  deleteAccount: async (password: string): Promise<{ message: string }> => {
    const response = await api.delete('/api/user/account', { data: { password } });
    return response.data;
  },

  requestEmailVerification: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/user/verify-email');
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post('/api/user/verify-email/confirm', { token });
    return response.data;
  },

  getSessions: async (): Promise<Array<{
    id: string; device: string; browser: string;
    location: string; lastActive: string; current: boolean;
  }>> => {
    const response = await api.get('/api/user/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/user/sessions/${sessionId}`);
    return response.data;
  },

  exportData: async (): Promise<Blob> => {
    const response = await api.get('/api/user/export', { responseType: 'blob' });
    return response.data;
  },
};
