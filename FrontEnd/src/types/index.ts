// User & Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin' | 'courier';
  phone?: string;
  address?: Address;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Menu & Product Types
export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime: number; // in minutes
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  averageRating: number;
  reviewCount: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  appliedCoupon?: Coupon;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  type: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  specialInstructions?: string;
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// Reservation Types
export interface Reservation {
  id: string;
  userId: string;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  createdAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface TimeSlot {
  time: string;
  available: boolean;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  orderId?: string;
  productId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

// Admin Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeReservations: number;
  newReviews: number;
  popularProducts: Product[];
}

export interface WorkSchedule {
  dayOfWeek: number; // 0-6
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
