import { apiRequest } from './client';

export interface AnswerData {
  content?: string;
  specialty?: string;
  attachment?: File;
}

export const answersAPI = {
  create: async (caseId: string, data: AnswerData) => {
    const formData = new FormData();
    // Only append content if it's provided and not empty
    // Note: We check for both undefined and empty string
    const content = data.content?.trim();
    if (content && content.length > 0) {
      formData.append('content', content);
    }
    // Specialty is optional - backend gets it from the authenticated user
    if (data.specialty) {
      formData.append('specialty', data.specialty);
    }
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    return apiRequest(`/answers/${caseId}`, {
      method: 'POST',
      body: formData,
    });
  },

  update: async (caseId: string, answerId: string, data: Partial<AnswerData>) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.specialty) formData.append('specialty', data.specialty);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    return apiRequest(`/answers/${caseId}/${answerId}`, {
      method: 'PUT',
      body: formData,
    });
  },

  delete: async (caseId: string, answerId: string) => {
    return apiRequest(`/answers/${caseId}/${answerId}`, {
      method: 'DELETE',
    });
  },

  vote: async (caseId: string, answerId: string) => {
    return apiRequest(`/answers/${caseId}/${answerId}/vote`, {
      method: 'POST',
    });
  },
};

