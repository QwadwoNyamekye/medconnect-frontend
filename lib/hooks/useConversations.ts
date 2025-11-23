'use client';

import { useEffect, useState } from 'react';
import { conversationsAPI } from '@/lib/api';

interface ConversationSummary {
  id: string;
  title?: string;
  isGroup: boolean;
  unreadCount: number;
  updatedAt: string;
  participantLinks: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      specialty?: string;
    };
    role: string;
    lastReadAt?: string | null;
    userId: string;
  }>;
  messages?: Array<{
    id: string;
    content: string | null;
    type: 'text' | 'image' | 'file';
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMimeType?: string | null;
    attachmentSize?: number | null;
    createdAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
  }>;
}

interface UseConversationsResult {
  conversations: ConversationSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useConversations = (): UseConversationsResult => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await conversationsAPI.list();
      setConversations(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
  };
};

