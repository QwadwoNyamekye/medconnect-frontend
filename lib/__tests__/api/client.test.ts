import { apiRequest, getToken } from '../../api/client';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      expect(getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('apiRequest', () => {
    it('should make successful API request', async () => {
      const mockResponse = { success: true, data: { id: '123' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      });

      const result = await apiRequest('/test');

      expect(result).toEqual(mockResponse.data);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/test');
      expect(fetchCall[1].headers).toBeInstanceOf(Headers);
      expect(fetchCall[1].headers.get('Content-Type')).toBe('application/json');
    });

    it('should include authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      const mockResponse = { success: true, data: {} };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      });

      await apiRequest('/test');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers).toBeInstanceOf(Headers);
      expect(fetchCall[1].headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should handle FormData correctly', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']));
      const mockResponse = { success: true, data: {} };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      });

      await apiRequest('/upload', {
        method: 'POST',
        body: formData,
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      if (headers instanceof Headers) {
        expect(headers.get('Content-Type')).toBeNull();
      } else {
        expect(headers).not.toHaveProperty('Content-Type');
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiRequest('/test')).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      const errorResponse = { error: 'Bad Request' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorResponse),
        json: async () => errorResponse,
      });

      await expect(apiRequest('/test')).rejects.toThrow('Bad Request');
    });
  });
});

