import axios from 'axios';
import { 
  GetOrderDto, 
  GetOrderListItemDto, 
  PostOrderDto, 
  PutOrderDto,
  OrderStatusEnum,
  DeliveryTypeEnum 
} from '@/types';

const BASE_URL = 'https://localhost:7156/api/Orders';

// Helper to convert enum value to string for FormData
const getOrderStatusString = (status: OrderStatusEnum): string => {
  return OrderStatusEnum[status];
};

const getDeliveryTypeString = (type: DeliveryTypeEnum): string => {
  return DeliveryTypeEnum[type];
};

export const getOrders = async (page: number = 1, take: number = 10) => {
  const res = await axios.get<GetOrderListItemDto[]>(BASE_URL, {
    params: { page, take }
  });
  return res;
};

export const getOrder = async (id: string) => {
  const res = await axios.get<GetOrderDto>(`${BASE_URL}/${id}`);
  return res;
};

export const createOrder = async (data: PostOrderDto) => {
  const formData = new FormData();
  formData.append('UserId', data.userId);
  
  if (data.tableId) {
    formData.append('TableId', data.tableId);
  }
  
  // Add items as JSON array (backend expects IReadOnlyList<PostOrderItemDto>)
  data.items.forEach((item, index) => {
    formData.append(`Items[${index}].ProductId`, item.productId);
    formData.append(`Items[${index}].Quantity`, item.quantity.toString());
  });
  
  if (data.orderNotes) {
    formData.append('OrderNotes', data.orderNotes);
  }
  
  if (data.deliveryAddress) {
    formData.append('DeliveryAddress', data.deliveryAddress);
  }
  
  if (data.tableNumber !== undefined && data.tableNumber !== null) {
    formData.append('TableNumber', data.tableNumber.toString());
  }
  
  if (data.couponId) {
    formData.append('CouponId', data.couponId);
  }
  
  formData.append('Type', data.type.toString());
  
  const res = await axios.post<string>(BASE_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res;
};

export const updateOrder = async (id: string, data: PutOrderDto) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res;
};

export const deleteOrder = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res;
};

// Helper function to get status label

export const getDeliveryTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: 'Çatdırılma',
    2: 'Götürmə',
    3: 'Restoranda',
  };
  return labels[type] || 'Naməlum';
};

export const getOrderStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    1: 'Gözləyir',
    2: 'Təsdiqlənib',
    3: 'Hazırlanır',
    4: 'Hazırdır',
    5: 'Yoldadır',
    6: 'Çatdırılıb',
    7: 'Tamamlandı',
    8: 'Ləğv edilib',
    9: 'Uğursuz',
  };
  return labels[status] || 'Naməlum';
};

export const getOrderStatusColor = (status: number): string => {
  const colors: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-purple-100 text-purple-800',
    4: 'bg-green-100 text-green-800',
    5: 'bg-indigo-100 text-indigo-800',
    6: 'bg-teal-100 text-teal-800',
    7: 'bg-gray-100 text-gray-800',
    8: 'bg-red-100 text-red-800',
    9: 'bg-red-200 text-red-900',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
