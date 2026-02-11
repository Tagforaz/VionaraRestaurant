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
  const formData = new FormData();
  formData.append('Status', data.status.toString());
  
  if (data.courierId) {
    formData.append('CourierId', data.courierId);
  }
  
  const res = await axios.put(`${BASE_URL}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res;
};

export const deleteOrder = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res;
};

// Helper function to get status label
export const getOrderStatusLabel = (status: OrderStatusEnum): string => {
  const labels: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.Pending]: 'Gözləyir',
    [OrderStatusEnum.Confirmed]: 'Təsdiqlənib',
    [OrderStatusEnum.Preparing]: 'Hazırlanır',
    [OrderStatusEnum.Ready]: 'Hazırdır',
    [OrderStatusEnum.OutForDelivery]: 'Yoldadır',
    [OrderStatusEnum.Delivered]: 'Çatdırılıb',
    [OrderStatusEnum.Completed]: 'Tamamlandı',
    [OrderStatusEnum.Cancelled]: 'Ləğv edilib',
    [OrderStatusEnum.Failed]: 'Uğursuz'
  };
  return labels[status] || 'Naməlum';
};

// Helper function to get delivery type label
export const getDeliveryTypeLabel = (type: DeliveryTypeEnum): string => {
  const labels: Record<DeliveryTypeEnum, string> = {
    [DeliveryTypeEnum.DineIn]: 'Restoranda',
    [DeliveryTypeEnum.Delivery]: 'Çatdırılma',
    [DeliveryTypeEnum.Takeout]: 'Götürmə'
  };
  return labels[type] || 'Naməlum';
};

// Helper function to get status badge color
export const getOrderStatusColor = (status: OrderStatusEnum): string => {
  const colors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.Pending]: 'bg-yellow-100 text-yellow-800',
    [OrderStatusEnum.Confirmed]: 'bg-blue-100 text-blue-800',
    [OrderStatusEnum.Preparing]: 'bg-purple-100 text-purple-800',
    [OrderStatusEnum.Ready]: 'bg-green-100 text-green-800',
    [OrderStatusEnum.OutForDelivery]: 'bg-indigo-100 text-indigo-800',
    [OrderStatusEnum.Delivered]: 'bg-teal-100 text-teal-800',
    [OrderStatusEnum.Completed]: 'bg-gray-100 text-gray-800',
    [OrderStatusEnum.Cancelled]: 'bg-red-100 text-red-800',
    [OrderStatusEnum.Failed]: 'bg-red-200 text-red-900'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
