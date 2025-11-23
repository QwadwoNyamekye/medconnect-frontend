// Detect API URL based on current hostname
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative path to go through Next.js proxy
    // This avoids CORS issues by proxying through the Next.js server
    return '/api';
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to make API requests
export const apiRequest = async (
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: BodyInit | Record<string, any> | null } = {},
): Promise<any> => {
  const token = getToken();
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  } as RequestInit;

  if (
    !isFormData &&
    fetchOptions.body &&
    typeof fetchOptions.body !== 'string'
  ) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    let data;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      // If JSON parsing fails, use the text as the error message
      data = { error: text || 'Request failed', message: text || 'Request failed' };
    }

    if (!response.ok) {
      // Handle standardized error format
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      const error: any = new Error(errorMessage);
      if (data && typeof data === 'object') {
        // Include validation details
        if (data.details) {
          error.details = data.details;
          // Also add a formatted message for validation errors
          if (Array.isArray(data.details) && data.details.length > 0) {
            const validationMessages = data.details
              .map((detail: any) => detail.msg || detail.message || JSON.stringify(detail))
              .join('; ');
            error.message = `${errorMessage}: ${validationMessages}`;
          }
        }
        if (data.success !== undefined) {
          error.success = data.success;
        }
      }
      error.status = response.status;
      throw error;
    }

    // Handle standardized success format
    if (data.success !== undefined) {
      return data.data !== undefined ? data.data : data;
    }

    return data;
  } catch (error: any) {
    // Handle network errors (fetch failures)
    if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
      const networkError: any = new Error(
        'Network error: Unable to connect to the server. Please check your internet connection and ensure the server is running.'
      );
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    // Re-throw other errors
    throw error;
  }
};

