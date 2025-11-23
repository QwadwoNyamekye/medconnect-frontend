import { apiRequest } from './client';

export const adminAPI = {
  // Message management
  editMessage: async (messageId: string, content: string) => {
    return apiRequest(`/admin/messages/${messageId}`, {
      method: 'PUT',
      body: { content } as any,
    });
  },

  toggleMessageVisibility: async (messageId: string, hidden: boolean) => {
    return apiRequest(`/admin/messages/${messageId}/visibility`, {
      method: 'PATCH',
      body: { hidden } as any,
    });
  },

  deleteMessage: async (messageId: string) => {
    return apiRequest(`/admin/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Answer management
  editAnswer: async (answerId: string, content: string) => {
    return apiRequest(`/admin/answers/${answerId}`, {
      method: 'PUT',
      body: { content } as any,
    });
  },

  toggleAnswerVisibility: async (answerId: string, hidden: boolean) => {
    return apiRequest(`/admin/answers/${answerId}/visibility`, {
      method: 'PATCH',
      body: { hidden } as any,
    });
  },

  deleteAnswer: async (answerId: string) => {
    return apiRequest(`/admin/answers/${answerId}`, {
      method: 'DELETE',
    });
  },

  // User management
  getAllUsers: async (page: number = 1, limit: number = 50, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    return apiRequest(`/admin/users?${params.toString()}`);
  },

  resetPassword: async (userId: string, newPassword: string) => {
    return apiRequest(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: { newPassword } as any,
    });
  },

  deleteUser: async (userId: string) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  updateUser: async (userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    title?: string;
    phoneNumber?: string;
    country?: string;
    hospital?: string;
    specialty?: string;
    licenseNumber?: string;
    credentials?: string[];
    bio?: string;
    role?: 'doctor' | 'admin' | 'hospital_admin';
    showPhone?: boolean;
    showEmail?: boolean;
  }) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: data as any,
    });
  },

  // Content listing
  getAllMessages: async (page: number = 1, limit: number = 50, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    return apiRequest(`/admin/messages?${params.toString()}`);
  },

  getAllAnswers: async (page: number = 1, limit: number = 50, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    return apiRequest(`/admin/answers?${params.toString()}`);
  },

  // Broadcast messaging
  broadcastMessage: async (content: string, title?: string) => {
    return apiRequest('/admin/broadcast', {
      method: 'POST',
      body: { content, title } as any,
    });
  },
};

