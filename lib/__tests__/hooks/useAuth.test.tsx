import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  authAPI: {
    getMe: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should return unauthenticated state when no token exists', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch user data when token exists but user data does not', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    localStorage.setItem('token', 'valid-token');
    (authAPI.getMe as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });

    expect(authAPI.getMe).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should use cached user data when both token and user data exist', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });

    // Should not call API when user data is cached
    expect(authAPI.getMe).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    localStorage.setItem('token', 'invalid-token');
    (authAPI.getMe as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should provide logout function', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(true);
    });

    result.current.logout();

    // Check that removeItem was called for both token and user
    expect(localStorage.removeItem).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.isAuthed).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it('should provide refresh function', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    // Don't set user data so refresh will fetch it
    (authAPI.getMe as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthed).toBe(true);
      expect(result.current.user).toBeDefined();
    });

    const updatedUser = { ...mockUser, firstName: 'Updated' };
    (authAPI.getMe as jest.Mock).mockResolvedValue(updatedUser);
    // Clear user from localStorage to force refresh to fetch
    localStorage.removeItem('user');

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe(updatedUser.id);
    });
  });
});

