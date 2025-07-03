import axios from 'axios';
import { handleApiError, isAuthError } from '@/utils/errorHandler';

/**
 * Centralized API client with global error handling
 * This replaces individual axios instances in service files
 */

// Create the main API client
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 second timeout
});

// Store auth context reference for token access and logout functionality
let authContextRef = null;
let isLoggingOut = false; // Synchronous flag to prevent duplicate logouts

/**
 * Resets the logout flag. This should be called on a successful login
 * to ensure the error handling works correctly for the new session.
 */
export const resetLogoutFlag = () => {
  isLoggingOut = false;
};

/**
 * Set the auth context reference for token access and logout functionality
 * This should be called from App.jsx or AuthProvider
 */
export const setAuthContext = (authContext) => {
  authContextRef = authContext;
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth context instead of directly from sessionStorage
    const token = authContextRef?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Success response - just return it
    return response;
  },
  (error) => {
    // Check for an auth error to de-duplicate logout actions
    if (isAuthError(error)) {
      if (isLoggingOut) {
        // A logout is already in progress. Suppress this error to prevent
        // duplicate toasts and logout calls.
        error.isSuppressed = true;
        return Promise.reject(error);
      }
      isLoggingOut = true;
    }

    // Global error handling
    const context = error.config?.metadata?.context || 'performing this action';
    const errorResult = handleApiError(error, context, authContextRef?.logout);

    // Attach processed error info to the error object
    error.processedError = errorResult;

    // Log for debugging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 API Error: ${context}`);
      console.error('Original error:', error);
      console.error('Processed error:', errorResult);
      console.groupEnd();
    }

    return Promise.reject(error);
  }
);

/**
 * Enhanced API methods with context metadata
 */
export const api = {
  get: (url, context = 'fetching data', config = {}) => {
    return apiClient.get(url, {
      ...config,
      metadata: { context },
    });
  },

  post: (url, data, context = 'creating data', config = {}) => {
    return apiClient.post(url, data, {
      ...config,
      metadata: { context },
    });
  },

  put: (url, data, context = 'updating data', config = {}) => {
    return apiClient.put(url, data, {
      ...config,
      metadata: { context },
    });
  },

  delete: (url, context = 'deleting data', config = {}) => {
    return apiClient.delete(url, {
      ...config,
      metadata: { context },
    });
  },

  patch: (url, data, context = 'updating data', config = {}) => {
    return apiClient.patch(url, data, {
      ...config,
      metadata: { context },
    });
  },
};

export default apiClient;
