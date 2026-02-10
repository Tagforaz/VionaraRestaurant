import axios from 'axios';

const BASE_URL = 'https://localhost:7156/api/Authentication';

export type LoginDto = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
};

export const login = async (data: LoginDto): Promise<AuthResponse> => {
  const formData = new FormData();
  formData.append('Email', data.email);
  formData.append('Password', data.password);

  const res = await axios.post<AuthResponse>(
    `${BASE_URL}/login`,
    formData
  );

  return res.data;
};
