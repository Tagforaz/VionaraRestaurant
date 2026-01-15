import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast({
        title: 'Session Expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
      });
    } else if (status === 403) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
    } else if (status === 404) {
      toast({
        title: 'Not Found',
        description: message || 'The requested resource was not found.',
        variant: 'destructive',
      });
    } else if (status && status >= 500) {
      toast({
        title: 'Server Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    } else if (error.code === 'ECONNABORTED') {
      toast({
        title: 'Request Timeout',
        description: 'The request took too long. Please try again.',
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
