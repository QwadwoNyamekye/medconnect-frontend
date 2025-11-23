import { apiRequest } from './client';

export interface ProfileData {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
  hospital?: string;
  specialty?: string;
  bio?: string;
  credentials?: string[];
  showPhone?: boolean;
  showEmail?: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface UserListFilters {
  search?: string;
  hospitals?: string | string[];
  specialties?: string | string[];
}

export const usersAPI = {
  updateProfile: async (data: ProfileData) => {
    return apiRequest('/users/me', {
      method: 'PUT',
      body: data,
    });
  },

  list: async (filters: UserListFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.hospitals) {
      const hospitals = Array.isArray(filters.hospitals) 
        ? filters.hospitals 
        : [filters.hospitals];
      hospitals.forEach(h => params.append('hospitals', h));
    }
    if (filters.specialties) {
      const specialties = Array.isArray(filters.specialties) 
        ? filters.specialties 
        : [filters.specialties];
      specialties.forEach(s => params.append('specialties', s));
    }

    const query = params.toString();
    return apiRequest(`/users${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },
};

