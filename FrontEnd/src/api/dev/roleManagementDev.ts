import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/RoleManagement';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Enums matching backend
export enum BackendUserRole {
  Customer = 1,
  Admin = 2,
  Chef = 3,
  Waiter = 4,
  Moderator = 5,
  Courier = 6
}

// DTOs matching backend
export interface GetUserListDto {
  id: string;
  fullName: string;
  email: string;
  role: BackendUserRole;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
  lastLoginAt?: string;
}

export interface GetUserDetailDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BackendUserRole;
  isActive: boolean;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
}

export interface PostUserByAdminDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: BackendUserRole;
  phoneNumber?: string;
}

export interface PutUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: BackendUserRole;
  phoneNumber?: string;
  isActive: boolean;
}

export interface AssignRoleDto {
  role: BackendUserRole;
}

export interface UserFilterDto {
  page?: number;
  take?: number;
  searchTerm?: string;
  role?: BackendUserRole;
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface PagedResult<T> {
  page: number;
  take: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

export interface GetSoftDeletedUserDto {
  id: string;
  fullName: string;
  email: string;
  role: BackendUserRole;
  deletedAt: string;
  avatarUrl?: string;
}

// API Functions
export const createUser = async (dto: PostUserByAdminDto) => {
  const res = await axios.post(`${BASE_URL}/create-user`, dto, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const assignRole = async (userId: string, dto: AssignRoleDto) => {
  const res = await axios.put(`${BASE_URL}/${userId}/assign-role`, dto, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getAllUsers = async (filter?: UserFilterDto) => {
  const params = new URLSearchParams();
  if (filter?.page) params.append('Page', filter.page.toString());
  if (filter?.take) params.append('Take', filter.take.toString());
  if (filter?.searchTerm) params.append('SearchTerm', filter.searchTerm);
  if (filter?.role !== undefined) params.append('Role', filter.role.toString());
  if (filter?.isActive !== undefined) params.append('IsActive', filter.isActive.toString());
  if (filter?.createdAfter) params.append('CreatedAfter', filter.createdAfter);
  if (filter?.createdBefore) params.append('CreatedBefore', filter.createdBefore);

  const res = await axios.get<PagedResult<GetUserListDto>>(`${BASE_URL}/users?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getUserById = async (userId: string) => {
  const res = await axios.get<GetUserDetailDto>(`${BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updateUser = async (userId: string, dto: PutUserDto) => {
  const res = await axios.put(`${BASE_URL}/users/${userId}`, dto, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteUser = async (userId: string) => {
  const res = await axios.delete(`${BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const hardDeleteUser = async (userId: string) => {
  const res = await axios.delete(`${BASE_URL}/users/${userId}?hard=true`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getUserRoles = async (userId: string) => {
  const res = await axios.get<{ userId: string; roles: string[] }>(`${BASE_URL}/users/${userId}/roles`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getSoftDeletedUsers = async (filter?: UserFilterDto) => {
  const params = new URLSearchParams();
  if (filter?.page) params.append('Page', filter.page.toString());
  if (filter?.take) params.append('Take', filter.take.toString());
  if (filter?.searchTerm) params.append('SearchTerm', filter.searchTerm);
  if (filter?.role !== undefined) params.append('Role', filter.role.toString());

  const res = await axios.get<PagedResult<GetSoftDeletedUserDto>>(`${BASE_URL}/users/soft-deleted?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const restoreUser = async (userId: string) => {
  const res = await axios.post(`${BASE_URL}/users/${userId}/restore`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Helper function to get role label
export const getRoleLabel = (role: BackendUserRole): string => {
  switch (role) {
    case BackendUserRole.Customer: return 'Müştəri';
    case BackendUserRole.Admin: return 'Administrator';
    case BackendUserRole.Chef: return 'Aşbaz';
    case BackendUserRole.Waiter: return 'Ofisant';
    case BackendUserRole.Moderator: return 'Moderator';
    case BackendUserRole.Courier: return 'Kuryer';
    default: return `Naməlum (${role})`;
  }
};

// Helper function to get role badge color
export const getRoleBadgeColor = (role: BackendUserRole): string => {
  switch (role) {
    case BackendUserRole.Customer: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case BackendUserRole.Admin: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case BackendUserRole.Chef: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case BackendUserRole.Waiter: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case BackendUserRole.Moderator: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case BackendUserRole.Courier: return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Helper to check if role can be assigned by admin
export const canAssignRole = (role: BackendUserRole): boolean => {
  // Customer role cannot be assigned via admin panel (backend restriction)
  return role !== BackendUserRole.Customer;
};
