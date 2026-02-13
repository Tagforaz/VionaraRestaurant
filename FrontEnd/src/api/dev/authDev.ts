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
  console.log('🔐 Logging in with:', { email: data.email });
  
  try {
    // Try with FormData first (as backend uses [FromForm])
    const formData = new FormData();
    formData.append('Email', data.email);
    formData.append('Password', data.password);

    // Don't set Content-Type - let axios set it automatically with boundary
    const res = await axios.post<TokenResponseDto>(
      `${BASE_URL}/login`,
      formData
    );

    console.log('✅ Login successful');
    return res.data;
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.status, error.response?.data);
    
    // If 415 error, backend might expect JSON instead
    if (error.response?.status === 415) {
      console.log('🔄 Retrying with JSON format...');
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
      return res.data;
    }
    
    throw error;
  }
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
    // Don't set Content-Type - let axios set it automatically with boundary
    await axios.post(BASE_URL, formData);
    console.log('✅ Registration successful');
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    throw error;
  }
};
