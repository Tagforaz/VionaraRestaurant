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
  avatarUrl?: string; // Avatar URL from backend
  createdAt?: string; // User registration date
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

export const login = async (data: LoginDto): Promise<TokenResponseDto> => {
  console.log('🔐 Logging in with:', { email: data.email });
  
  try {
    // Backend uses [FromBody], so send JSON directly
    const res = await axios.post<TokenResponseDto>(
      `${BASE_URL}/login`,
      {
        email: data.email,
        password: data.password
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ Login successful');
    return res.data;
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.status, error.response?.data);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    throw error;
  }
};

export const register = async (data: RegisterDto): Promise<void> => {
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
    // Try with JSON first (most common for modern APIs)
    await axios.post(
      BASE_URL,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('✅ Registration successful');
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.status, error.response?.data);
    
    // If 415 error, backend might expect FormData instead
    if (error.response?.status === 415) {
      console.log('🔄 Retrying with FormData format...');
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
      
      await axios.post(BASE_URL, formData);
      console.log('✅ Registration successful (FormData)');
      return;
    }
    
    throw error;
  }
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<PasswordResetResponseDto> => {
  console.log('🔑 Requesting password reset for:', data.email);
  
  const res = await axios.post<PasswordResetResponseDto>(
    `${BASE_URL}/forgot-password`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  console.log('✅ Reset code sent');
  return res.data;
};

export const verifyResetCode = async (data: VerifyResetCodeDto): Promise<PasswordResetResponseDto> => {
  console.log('🔍 Verifying reset code for:', data.email);
  
  const res = await axios.post<PasswordResetResponseDto>(
    `${BASE_URL}/verify-reset-code`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  console.log('✅ Code verified');
  return res.data;
};

export const resetPassword = async (data: ResetPasswordDto): Promise<{ message: string }> => {
  console.log('🔐 Resetting password for:', data.email);
  
  const res = await axios.post<{ message: string }>(
    `${BASE_URL}/reset-password`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  console.log('✅ Password reset successful');
  return res.data;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  console.log('📤 Uploading avatar for user:', userId);
  
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await axios.post<{ avatarUrl: string; message: string }>(
    `${BASE_URL}/upload-avatar`,
    formData,
    {
      params: { userId },
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  
  console.log('✅ Avatar uploaded successfully:', res.data.message);
  return res.data.avatarUrl;
};


