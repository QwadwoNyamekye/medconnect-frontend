import { useCallback, useEffect, useState } from 'react';
import { usersAPI } from '@/lib/api';

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  specialty?: string;
  hospital?: string;
}

interface UseUsersResult {
  users: UserSummary[];
  loading: boolean;
  error: string | null;
  search: (term: string) => Promise<void>;
}

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (term = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.list({ search: term });
      if (Array.isArray(response)) {
        setUsers(response);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    search: fetchUsers,
  };
};

