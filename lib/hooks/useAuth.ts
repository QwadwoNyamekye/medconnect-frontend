'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  hospital?: string;
  specialty?: string;
  profilePicture?: string;
  credentials?: string[];
  bio?: string;
  score?: number;
  answerVotesReceived?: number;
  caseVotesReceived?: number;
  showPhone?: boolean;
  showEmail?: boolean;
  role?: 'doctor' | 'admin';
}

interface UseAuthResult {
  user: User | null;
  isAuthed: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    
    if (token) {
      // If we have a token but no user data, fetch it
      if (!raw) {
        try {
          const fetchedUser = await authAPI.getMe();
          if (fetchedUser?.id) {
            localStorage.setItem('user', JSON.stringify(fetchedUser));
            setUser(fetchedUser);
            setIsAuthed(true);
          } else {
            setUser(null);
            setIsAuthed(false);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Token might be invalid, clear it
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthed(false);
        }
      } else {
        // We have both token and user data
        try {
          const parsed = JSON.parse(raw);
          setUser(parsed);
          setIsAuthed(Boolean(parsed?.id));
        } catch {
          setUser(null);
          setIsAuthed(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } else {
      // No token, clear everything
      setUser(null);
      setIsAuthed(false);
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthed(false);
  }, []);

  useEffect(() => {
    refresh();
    
    // Listen for storage changes (e.g., login in another tab)
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        refresh();
      };
      
      window.addEventListener('storage', handleStorageChange);
      // Also listen for custom auth events
      window.addEventListener('medconnect-auth-changed', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('medconnect-auth-changed', handleStorageChange);
      };
    }
  }, [refresh]);

  return { user, isAuthed, loading, refresh, logout };
}

