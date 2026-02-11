// User & Auth Types
export type UserRole = 'customer' | 'admin' | 'chef' | 'waiter' | 'moderator' | 'courier';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  address?: Address;
  createdAt: string;
}

export interface RolePermissions {
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewDeliveries: boolean;
  canManageDeliveries: boolean;
  canViewReservations: boolean;
  canManageReservations: boolean;
  canViewReviews: boolean;
  canManageReviews: boolean;
  canViewQRCodes: boolean;
  canManageQRCodes: boolean;
  canViewMenu: boolean;
  canManageMenu: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewSettings: boolean;
  canManageSettings: boolean;
  canViewDashboard: boolean;
  canViewInternalOrders: boolean;
  canViewExternalOrders: boolean;
}

export interface Employee extends User {
  role: Exclude<UserRole, 'customer'>;
  assignedBy?: string;
  assignedAt?: string;
  isActive: boolean;
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
  nameKey?: string; // Translation key for product name
  description: string;
  descriptionKey?: string; // Translation key for product description
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
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  type: DeliveryType;
  deliveryAddress?: Address;
  courierId?: string;
  courier?: Courier;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  specialInstructions?: string;
  estimatedTime?: string;
  deliveryTracking?: DeliveryTracking;
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
  | 'accepted'
  | 'rejected'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type DeliveryType = 'delivery' | 'pickup' | 'dine-in';

// Backend Order DTOs (matching C# backend)
export enum OrderStatusEnum {
  Pending = 0,
  Confirmed = 1,
  Preparing = 2,
  Ready = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Completed = 6,
  Cancelled = 7,
  Failed = 8
}

export enum DeliveryTypeEnum {
  DineIn = 0,
  Delivery = 1,
  Takeout = 2
}

export interface GetOrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  courierId?: string;
  courierName?: string;
  userEmail: string;
  tableId?: string;
  status: OrderStatusEnum;
  type: DeliveryTypeEnum;
  tableNumber?: number;
  subtotal: number;
  total: number;
  discountAmount: number;
  couponId?: string;
  orderNotes?: string;
  deliveryAddress?: string;
  createdAt: string;
  items: GetOrderItemDto[];
}

export interface GetOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface GetOrderListItemDto {
  id: string;
  orderNumber: string;
  userEmail: string;
  tableNumber?: number;
  total: number;
  status: OrderStatusEnum;
  deliveryType: DeliveryTypeEnum;
  createdAt: string;
}

export interface PostOrderDto {
  userId: string;
  tableId?: string;
  items: PostOrderItemDto[];
  orderNotes?: string;
  deliveryAddress?: string;
  tableNumber?: number;
  couponId?: string;
  type: DeliveryTypeEnum;
}

export interface PostOrderItemDto {
  productId: string;
  quantity: number;
}

export interface PutOrderDto {
  status: OrderStatusEnum;
  courierId?: string;
}

// Courier Types
export interface Courier {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'car' | 'motorcycle';
  vehicleNumber: string;
  status: CourierStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  rating: number;
  totalDeliveries: number;
  activeDeliveries: number;
  profilePhoto?: string;
  isActive: boolean;
  createdAt: string;
}

export type CourierStatus = 'available' | 'busy' | 'offline';

export interface DeliveryTracking {
  orderId: string;
  courierId?: string;
  courier?: Courier;
  status: OrderStatus;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryAddress: Address;
  customerLocation: {
    latitude: number;
    longitude: number;
  };
  updates: DeliveryUpdate[];
}

export interface DeliveryUpdate {
  id: string;
  timestamp: string;
  status: OrderStatus;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

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
