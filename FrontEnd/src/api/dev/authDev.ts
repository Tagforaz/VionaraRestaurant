import axios from 'axios';
import api from '../axiosInstance';

const BASE_URL = 'https://localhost:7200/api/Authentication';

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
  expires: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type ForgotPasswordDto = {
  email: string;
};

export type VerifyResetCodeDto = {
  email: string;
  code: string;
};

export type ResetPasswordDto = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordResetResponseDto = {
  message: string;
  expiresInMinutes: number;
};

// Login/Register/ForgotPassword token tələb etmir — birbaşa axios
export const login = async (data: LoginDto): Promise<TokenResponseDto> => {
  console.log('🔐 Logging in with:', { email: data.email });
  try {
    const res = await axios.post<TokenResponseDto>(
      `${BASE_URL}/login`,
      { email: data.email, password: data.password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ Login successful');
    return res.data;
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.status, error.response?.data);
    throw error;
  }
};

export const register = async (data: RegisterDto): Promise<void> => {
  try {
    await axios.post(
      BASE_URL,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ Registration successful');
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.status, error.response?.data);
    throw error;
  }
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<PasswordResetResponseDto> => {
  const res = await axios.post<PasswordResetResponseDto>(
    `${BASE_URL}/forgot-password`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

export const verifyResetCode = async (data: VerifyResetCodeDto): Promise<PasswordResetResponseDto> => {
  const res = await axios.post<PasswordResetResponseDto>(
    `${BASE_URL}/verify-reset-code`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

export const resetPassword = async (data: ResetPasswordDto): Promise<{ message: string }> => {
  const res = await axios.post<{ message: string }>(
    `${BASE_URL}/reset-password`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

// Avatar upload token tələb edir
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ avatarUrl: string; message: string }>(
    '/api/Authentication/upload-avatar',
    formData,
    { params: { userId } }
  );
  console.log('✅ Avatar uploaded:', res.data.message);
  return res.data.avatarUrl;
};
