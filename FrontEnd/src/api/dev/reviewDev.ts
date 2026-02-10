import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Reviews';

// Types matching backend DTOs
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
  const res = await axios.get<GetReviewDto[]>(BASE_URL);
  return res;
};

export const getReviewById = async (id: string) => {
  const res = await axios.get<GetReviewDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createReview = async (data: PostReviewDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    UserId: data.userId,
    ...(data.orderId && { OrderId: data.orderId }),
    ...(data.productId && { ProductId: data.productId }),
    Rating: data.rating,
    Comment: data.comment
  };
  const res = await axios.post(BASE_URL, payload);
  return res;
};

export const updateReview = async (id: string, data: PutReviewDto) => {
  // Transform to backend format (capitalized fields)
  const payload = {
    Rating: data.rating,
    Comment: data.comment,
    IsApproved: data.isApproved
  };
  const res = await axios.put(`${BASE_URL}/${id}`, payload);
  return res;
};

export const deleteReview = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res;
};
