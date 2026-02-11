import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Authentication';

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export type TokenResponseDto = {
  token: string;
  userName: string;
  expires: string; // ISO date string
};

export const login = async (data: LoginDto): Promise<TokenResponseDto> => {
  const formData = new FormData();
  formData.append('Email', data.email);
  formData.append('Password', data.password);

  const res = await axios.post<TokenResponseDto>(
    `${BASE_URL}/login`,
    formData
  );

  return res.data;
};

export const register = async (data: RegisterDto): Promise<void> => {
  const formData = new FormData();
  formData.append('FirstName', data.firstName);
  formData.append('LastName', data.lastName);
  formData.append('Email', data.email);
  formData.append('Password', data.password);
  formData.append('ConfirmPassword', data.confirmPassword);
  if (data.phoneNumber) {
    formData.append('PhoneNumber', data.phoneNumber);
  }
  if (data.avatarUrl) {
    formData.append('AvatarUrl', data.avatarUrl);
  }

  console.log('📤 Registering with data:', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    hasPassword: !!data.password,
    hasConfirmPassword: !!data.confirmPassword,
    phoneNumber: data.phoneNumber,
    avatarUrl: data.avatarUrl
  });

  try {
    await axios.post(BASE_URL, formData);
    console.log('✅ Registration successful');
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    throw error;
  }
};
