import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  averageRating: number;  // optional deyil — backend həmişə qaytarır
  reviewCount: number;    // optional deyil — backend həmişə qaytarır
  createdAt?: string;
}

export const getCategoriesForDropdown = async (): Promise<CategoryDto[]> => {
  // ← /api/api/ → /api/ düzəldildi
  const res = await axios.get<CategoryDto[]>(`${BASE_URL}/categories/dropdown`, { headers: getAuthHeaders() });
  return res.data;
};

export const getAllProducts = async (page = 1, take = 100): Promise<ProductDto[]> => {
  const res = await axios.get(`${BASE_URL}/products?page=${page}&take=${take}`, { headers: getAuthHeaders() });
  return res.data?.data || res.data || [];
};

export const getProductById = async (id: string): Promise<ProductDto> => {
  const res = await axios.get<ProductDto>(`${BASE_URL}/products/${id}`, { headers: getAuthHeaders() });
  return res.data;
};