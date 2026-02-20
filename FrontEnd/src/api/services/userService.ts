import { apiClient } from '../client';
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
  email: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  push: {
    orderStatus: boolean;
    newMessages: boolean;
    systemAlerts: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    deliveryUpdates: boolean;
  };
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
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<any> => {
    const response = await apiClient.put('/api/user/profile', data);
    return response.data;
  },

  /**
   * Upload profile avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/authentication/upload-avatar', formData, {
      params: { userId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/user/change-password', data);
    return response.data;
  },

  /**
   * Enable/disable two-factor authentication
   */
  toggle2FA: async (enabled: boolean): Promise<{ enabled: boolean; qrCode?: string }> => {
    const response = await apiClient.post('/user/2fa', { enabled });
    return response.data;
  },

  /**
   * Verify 2FA code
   */
  verify2FA: async (code: string): Promise<{ verified: boolean }> => {
    const response = await apiClient.post('/user/2fa/verify', { code });
    return response.data;
  },

  /**
   * Update notification settings
   */
  updateNotificationSettings: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    const response = await apiClient.put('/user/notifications', settings);
    return response.data;
  },

  /**
   * Get notification settings
   */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get('/user/notifications');
    return response.data;
  },

  /**
   * Get user statistics
   */
  getUserStatistics: async (): Promise<UserStatistics> => {
    const response = await apiClient.get('/user/statistics');
    return response.data;
  },

  /**
   * Get activity logs
   */
  getActivityLogs: async (limit = 20): Promise<ActivityLog[]> => {
    const response = await apiClient.get('/user/activity', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Delete account
   */
  deleteAccount: async (password: string): Promise<{ message: string }> => {
    const response = await apiClient.delete('/user/account', {
      data: { password },
    });
    return response.data;
  },

  /**
   * Request email verification
   */
  requestEmailVerification: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/user/verify-email');
    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/user/verify-email/confirm', { token });
    return response.data;
  },

  /**
   * Get user sessions
   */
  getSessions: async (): Promise<Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>> => {
    const response = await apiClient.get('/user/sessions');
    return response.data;
  },

  /**
   * Revoke a session
   */
  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/user/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Export user data (GDPR compliance)
   */
  exportData: async (): Promise<Blob> => {
    const response = await apiClient.get('/user/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};
