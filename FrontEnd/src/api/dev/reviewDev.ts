import api from '../axiosInstance';

const BASE_URL = '/api/Reviews';

export type GetReviewDto = {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
};

export type PostReviewDto = {
  userId: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
};

export type PutReviewDto = {
  rating: number;
  comment: string;
  isApproved: boolean;
};

export const getReviews = async () => {
  const res = await api.get<GetReviewDto[]>(BASE_URL);
  return res;
};

export const getReviewById = async (id: string) => {
  const res = await api.get<GetReviewDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createReview = async (data: PostReviewDto) => {
  const payload = {
    UserId: data.userId,
    ...(data.orderId && { OrderId: data.orderId }),
    ...(data.productId && { ProductId: data.productId }),
    Rating: data.rating,
    Comment: data.comment,
  };
  const res = await api.post(BASE_URL, payload);
  return res;
};

export const updateReview = async (id: string, data: PutReviewDto) => {
  const payload = {
    Rating: data.rating,
    Comment: data.comment,
    IsApproved: data.isApproved,
  };
  const res = await api.put(`${BASE_URL}/${id}`, payload);
  return res;
};

export const deleteReview = async (id: string) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res;
};