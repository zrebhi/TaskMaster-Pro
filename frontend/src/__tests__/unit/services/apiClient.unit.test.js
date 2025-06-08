import axios from 'axios';
import { handleApiError } from '../../../utils/errorHandler';

// Mock axios
jest.mock('axios');
const mockAxios = jest.mocked(axios);

// Mock error handler
jest.mock('../../../utils/errorHandler');
const mockHandleApiError = jest.mocked(handleApiError);

// Create mock axios instance
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

// Helper functions for interceptor access
const getRequestInterceptor = () =>
  mockAxiosInstance.interceptors.request.use.mock.calls[0]?.[0];

const getResponseInterceptor = () =>
  mockAxiosInstance.interceptors.response.use.mock.calls[0]?.[0];

const getResponseErrorHandler = () =>
  mockAxiosInstance.interceptors.response.use.mock.calls[0]?.[1];

describe('API Client Unit Tests', () => {
  let apiClientModule;
  let api;

  beforeAll(() => {
    // Setup mocks
    mockAxios.create.mockReturnValue(mockAxiosInstance);
    mockHandleApiError.mockReturnValue({
      message: 'Test error',
      severity: 'medium',
      isNetworkError: false,
    });

    // Import after mocks are set up
    apiClientModule = require('../../../services/apiClient');
    api = apiClientModule.api;
  });

  describe('API Client Configuration', () => {
    test('creates axios instance with correct base configuration', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 10000,
      });
    });

    test('sets up request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Request Interceptor', () => {
    test('adds authorization header when token is available', () => {
      // Arrange
      const authContext = { token: 'test-token', logout: jest.fn() };
      apiClientModule.setAuthContext(authContext);

      const requestInterceptor = getRequestInterceptor();
      const config = { headers: {} };

      // Act
      const result = requestInterceptor(config);

      // Assert
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    test('handles missing auth context gracefully', () => {
      // Arrange
      apiClientModule.setAuthContext(null);

      const requestInterceptor = getRequestInterceptor();
      const config = { headers: {} };

      // Act
      const result = requestInterceptor(config);

      // Assert
      expect(result.headers.Authorization).toBeUndefined();
      expect(result).toEqual(config);
    });
  });

  describe('Response Interceptor', () => {
    test('returns successful responses unchanged', () => {
      // Arrange
      const responseInterceptor = getResponseInterceptor();
      const mockResponse = { data: { message: 'Success' }, status: 200 };

      // Act
      const result = responseInterceptor(mockResponse);

      // Assert
      expect(result).toBe(mockResponse);
    });

    test('processes errors through handleApiError', async () => {
      // Arrange
      const responseErrorHandler = getResponseErrorHandler();
      const mockError = {
        response: { status: 400, data: { message: 'Bad Request' } },
        config: { metadata: { context: 'test operation' } },
      };

      const processedError = {
        message: 'Processed error message',
        severity: 'medium',
      };
      mockHandleApiError.mockReturnValue(processedError);

      // Act & Assert
      await expect(responseErrorHandler(mockError)).rejects.toEqual(
        expect.objectContaining({
          processedError,
        })
      );

      expect(mockHandleApiError).toHaveBeenCalledWith(
        mockError,
        'test operation',
        undefined
      );
    });
  });

  describe('Enhanced API Methods', () => {
    describe('HTTP methods with custom context', () => {
      test('api.get with custom context and config', () => {
        const url = '/test-endpoint';
        const context = 'fetching test data';
        const config = { headers: { Custom: 'header' } };

        api.get(url, context, config);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, {
          ...config,
          metadata: { context },
        });
      });

      test.each([
        ['post', { name: 'test' }, 'creating test data'],
        ['put', { name: 'updated' }, 'updating test data'],
        ['patch', { name: 'patched' }, 'patching test data'],
      ])('api.%s with custom context', (method, data, context) => {
        const url = '/test-endpoint';

        api[method](url, data, context);

        expect(mockAxiosInstance[method]).toHaveBeenCalledWith(url, data, {
          metadata: { context },
        });
      });

      test('api.delete with custom context', () => {
        const url = '/test-endpoint';
        const context = 'deleting test data';

        api.delete(url, context);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(url, {
          metadata: { context },
        });
      });
    });

    describe('HTTP methods with default context', () => {
      test.each([
        ['get', 'fetching data'],
        ['delete', 'deleting data'],
      ])('api.%s uses default context (no data)', (method, expectedContext) => {
        const url = '/test-endpoint';

        api[method](url);

        expect(mockAxiosInstance[method]).toHaveBeenCalledWith(url, {
          metadata: { context: expectedContext },
        });
      });

      test.each([
        ['post', { name: 'test' }, 'creating data'],
        ['put', { name: 'updated' }, 'updating data'],
        ['patch', { name: 'patched' }, 'updating data'],
      ])(
        'api.%s uses default context (with data)',
        (method, data, expectedContext) => {
          const url = '/test-endpoint';

          api[method](url, data);

          expect(mockAxiosInstance[method]).toHaveBeenCalledWith(url, data, {
            metadata: { context: expectedContext },
          });
        }
      );
    });
  });

  describe('Request Interceptor Error Handling', () => {
    test('handles request interceptor errors correctly', async () => {
      // Arrange
      const requestErrorHandler =
        mockAxiosInstance.interceptors.request.use.mock.calls[0][1];
      const error = new Error('Request setup failed');

      // Act & Assert
      await expect(requestErrorHandler(error)).rejects.toBe(error);
    });
  });

  describe('Development Environment Logging', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('logs errors to console in development environment', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleGroupEndSpy = jest
        .spyOn(console, 'groupEnd')
        .mockImplementation();

      const responseErrorHandler = getResponseErrorHandler();
      const error = {
        response: { status: 500, data: { message: 'Server Error' } },
        config: { metadata: { context: 'test operation' } },
      };

      responseErrorHandler(error).catch(() => {});

      expect(consoleSpy).toHaveBeenCalledWith('🚨 API Error: test operation');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Original error:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Processed error:',
        expect.any(Object)
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    test('does not log to console in production environment', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();

      const responseErrorHandler = getResponseErrorHandler();
      const error = {
        response: { status: 500, data: { message: 'Server Error' } },
      };

      responseErrorHandler(error).catch(() => {});

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
