import { apiRequest } from './client';

export interface HospitalServices {
  clinics: string[];
  inPatient: string[];
  labsAndImaging: string[];
  special: string[];
}

export interface ClinicSchedule {
  clinicName: string;
  days: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  time: string; // e.g., '09:00-17:00'
  doctor?: string;
  notes?: string;
}

export interface Hospital {
  id: string;
  name: string;
  country: string;
  level: 'primary' | 'secondary' | 'tertiary';
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  region: string;
  latitude?: number | null;
  longitude?: number | null;
  bedCapacity: number;
  services: HospitalServices;
  clinicSchedules: ClinicSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface HospitalFilters {
  search?: string;
  level?: 'primary' | 'secondary' | 'tertiary';
  city?: string;
  region?: string;
  country?: string;
}

export const hospitalsAPI = {
  getAll: async (filters: HospitalFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.level) params.append('level', filters.level);
    if (filters.city) params.append('city', filters.city);
    if (filters.region) params.append('region', filters.region);
    if (filters.country) params.append('country', filters.country);

    const query = params.toString();
    return apiRequest(`/hospitals${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/hospitals/${id}`);
  },

  create: async (data: Partial<Hospital>) => {
    return apiRequest('/hospitals', {
      method: 'POST',
      body: data as any,
    });
  },

  update: async (id: string, data: Partial<Hospital>) => {
    return apiRequest(`/hospitals/${id}`, {
      method: 'PUT',
      body: data as any,
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/hospitals/${id}`, {
      method: 'DELETE',
    });
  },
};

