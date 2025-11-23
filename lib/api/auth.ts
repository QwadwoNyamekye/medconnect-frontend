import { apiRequest } from './client';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  country?: string;
  hospital?: string;
  specialty?: string;
  licenseNumber?: string;
  bio?: string;
  title?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authAPI = {
  register: async (data: UserData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: data,
    });
  },

  login: async (data: LoginData) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: data,
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};

