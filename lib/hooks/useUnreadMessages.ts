'use client';

import { useState, useEffect } from 'react';
import { conversationsAPI } from '@/lib/api';

export function useUnreadMessages(isAuthed: boolean) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthed) {
      setUnreadCount(0);
      // Reset title when logged out
      if (typeof window !== 'undefined') {
        document.title = 'MedConnect';
      }
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const response = await conversationsAPI.list();
        if (cancelled) return;
        const totalUnread = Array.isArray(response)
          ? response.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0)
          : 0;
        setUnreadCount(totalUnread);
      } catch (error) {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();

    const handler = () => {
      fetchUnread();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('conversations-updated', handler);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('conversations-updated', handler);
      }
    };
  }, [isAuthed]);

  // Update browser tab title with unread count
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) MedConnect`;
    } else {
      document.title = 'MedConnect';
    }
  }, [unreadCount]);

  return unreadCount;
}

