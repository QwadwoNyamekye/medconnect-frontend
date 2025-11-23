import { apiRequest } from './client';

export interface MessageData {
  content?: string;
  type?: string;
  attachment?: File;
}

export interface CreateConversationData {
  participantIds: string[];
  title?: string;
  message?: MessageData;
}

export const conversationsAPI = {
  list: async () => {
    return apiRequest('/conversations');
  },

  get: async (id: string) => {
    return apiRequest(`/conversations/${id}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/conversations/${id}`);
  },

  create: async (data: CreateConversationData) => {
    const formData = new FormData();
    formData.append('participantIds', JSON.stringify(data.participantIds));
    if (data.title) formData.append('title', data.title);
    if (data.message) {
      if (data.message.content) formData.append('content', data.message.content);
      if (data.message.type) formData.append('type', data.message.type);
      if (data.message.attachment) {
        formData.append('attachment', data.message.attachment);
      }
    }

    return apiRequest('/conversations', {
      method: 'POST',
      body: formData,
    });
  },

  postMessage: async (id: string, data: MessageData) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.type) formData.append('type', data.type);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    return apiRequest(`/conversations/${id}/messages`, {
      method: 'POST',
      body: formData,
    });
  },

  updateTitle: async (id: string, title: string) => {
    return apiRequest(`/conversations/${id}/title`, {
      method: 'PUT',
      body: { title },
    });
  },
};

