import { apiRequest } from './client';

export interface CaseData {
  title: string;
  description: string;
  specialty?: string; // Optional - backend sets it from user profile
  urgency: string;
  tags?: string[];
  country?: string;
  media?: Array<{ url: string; type: string }>;
}

export interface CaseFilters {
  search?: string;
  urgency?: string;
  tags?: string | string[];
  openOnly?: boolean;
  page?: number;
  limit?: number;
}

export const casesAPI = {
  getAll: async (filters: CaseFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.openOnly) params.append('openOnly', 'true');
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return apiRequest(`/cases${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/cases/${id}`);
  },

  create: async (data: CaseData) => {
    return apiRequest('/cases', {
      method: 'POST',
      body: data,
    });
  },

  update: async (id: string, data: Partial<CaseData>) => {
    return apiRequest(`/cases/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/cases/${id}`, {
      method: 'DELETE',
    });
  },

  vote: async (id: string) => {
    return apiRequest(`/cases/${id}/vote`, {
      method: 'POST',
    });
  },

  close: async (id: string) => {
    return apiRequest(`/cases/${id}/close`, {
      method: 'PATCH',
    });
  },
};

