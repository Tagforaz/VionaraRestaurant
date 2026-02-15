import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Convert PascalCase/snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/^[A-Z]/, (match) => match.toLowerCase())
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Recursively convert object keys to camelCase
const keysToCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = keysToCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

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

// Response interceptor for handling errors and converting keys to camelCase
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Convert response data keys to camelCase
    if (response.data) {
      response.data = keysToCamelCase(response.data);
    }
    return response;
  },
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
