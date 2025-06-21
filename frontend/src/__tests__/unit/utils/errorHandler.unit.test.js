import {
  isNetworkError,
  isAuthError,
  isServerError,
  isClientError,
  getErrorMessage,
  getErrorSeverity,
  logError,
  handleApiError,
  ERROR_SEVERITY,
} from '../../../utils/errorHandler';
import {
  createMockApiError,
  createMockNetworkError,
  setupTest,
  cleanupMocks,
} from '../../helpers/test-utils';

describe('errorHandler', () => {
  let testSetup;
  let originalEnv;

  const setupEnvironment = () => {
    originalEnv = process.env.NODE_ENV;
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/test' },
      writable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Test User Agent',
      writable: true,
    });
  };

  const restoreEnvironment = () => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    }
  };

  beforeEach(() => {
    testSetup = setupTest();
    setupEnvironment();
  });

  afterEach(() => {
    testSetup.cleanup();
    cleanupMocks();
    restoreEnvironment();
  });

  const createErrorWithCode = (message, code) => {
    const error = new Error(message);
    error.code = code;
    return error;
  };

  const createErrorWithStatus = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
  };

  describe('isNetworkError', () => {
    it('should return true for network errors without response', () => {
      expect(isNetworkError(new Error('Network Error'))).toBe(true);
    });

    it('should return true for ECONNREFUSED errors', () => {
      expect(
        isNetworkError(
          createErrorWithCode('Connection refused', 'ECONNREFUSED')
        )
      ).toBe(true);
    });

    it('should return true for NETWORK_ERR errors', () => {
      expect(
        isNetworkError(createErrorWithCode('Network error', 'NETWORK_ERR'))
      ).toBe(true);
    });

    it('should return true for fetch-related errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    });

    it('should return false for errors with response', () => {
      expect(isNetworkError(createMockApiError(500, 'Server error'))).toBe(
        false
      );
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(new Error('Some other error'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 status in response', () => {
      expect(isAuthError(createMockApiError(401, 'Unauthorized'))).toBe(true);
    });

    it('should return true for 401 status directly on error', () => {
      expect(isAuthError(createErrorWithStatus('Unauthorized', 401))).toBe(
        true
      );
    });

    it('should return false for non-401 status codes', () => {
      expect(isAuthError(createMockApiError(400, 'Bad Request'))).toBe(false);
    });

    it('should return false for errors without status', () => {
      expect(isAuthError(new Error('Some error'))).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for 500 status code', () => {
      expect(
        isServerError(createMockApiError(500, 'Internal Server Error'))
      ).toBe(true);
    });

    it('should return true for 503 status code', () => {
      expect(
        isServerError(createMockApiError(503, 'Service Unavailable'))
      ).toBe(true);
    });

    it('should return true for status directly on error', () => {
      expect(isServerError(createErrorWithStatus('Server Error', 502))).toBe(
        true
      );
    });

    it('should return false for 4xx status codes', () => {
      expect(isServerError(createMockApiError(400, 'Bad Request'))).toBe(false);
    });

    it('should return false for errors without status', () => {
      expect(isServerError(new Error('Some error'))).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('should return true for 400 status code', () => {
      expect(isClientError(createMockApiError(400, 'Bad Request'))).toBe(true);
    });

    it('should return true for 404 status code', () => {
      expect(isClientError(createMockApiError(404, 'Not Found'))).toBe(true);
    });

    it('should return false for 401 status code', () => {
      expect(isClientError(createMockApiError(401, 'Unauthorized'))).toBe(
        false
      );
    });

    it('should return false for 5xx status codes', () => {
      expect(isClientError(createMockApiError(500, 'Server Error'))).toBe(
        false
      );
    });

    it('should return false for errors without status', () => {
      expect(isClientError(new Error('Some error'))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return network error message for network errors', () => {
      const error = createMockNetworkError();
      const message = getErrorMessage(error);
      expect(message).toBe(
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    });

    it('should return specific API message for auth errors', () => {
      // This tests the primary path: a 401 error with a clear message
      // from the backend, e.g., "Invalid credentials."
      const error = createMockApiError(401, 'Invalid credentials.');
      const message = getErrorMessage(error);
      expect(message).toBe('Invalid credentials.');
    });

    it('should return a generic auth error message if API provides no message', () => {
      // This tests the fallback path: a 401 error where the backend
      // failed to provide a message payload.
      const errorWithNoMessage = createMockApiError(401, '');
      errorWithNoMessage.response.data.message = undefined; // Be explicit
      const message = getErrorMessage(errorWithNoMessage);
      expect(message).toBe('Authentication failed. Please log in to continue.');
    });

    it('should return server error message for 5xx errors', () => {
      const error = createMockApiError(500, 'Internal Server Error');
      const message = getErrorMessage(error);
      expect(message).toBe(
        'The server is currently experiencing issues. Please try again in a few moments.'
      );
    });

    it('should return API message for client errors with API message', () => {
      const error = createMockApiError(400, 'Validation failed');
      const message = getErrorMessage(error);
      expect(message).toBe('Validation failed');
    });
 
    it('should return a contextual client error message if API provides no message', () => {
      const error = createMockApiError(400, '');
      error.response.data.message = '';
      const message = getErrorMessage(error, 'creating task');
      expect(message).toBe(
        'There was an issue with your request while creating task. Please check your input and try again.'
      );
    });
 
    it('should return API message when available for other errors', () => {
      const error = new Error('Some error');
      error.response = { data: { message: 'Custom API message' } };
      const message = getErrorMessage(error);
      expect(message).toBe('Custom API message');
    });

    it('should return generic message with context for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getErrorMessage(error, 'updating project');
      expect(message).toBe(
        'An unexpected error occurred while updating project. Please try again.'
      );
    });

    it('should use default context when none provided', () => {
      const error = new Error('Unknown error');
      const message = getErrorMessage(error);
      expect(message).toBe(
        'An unexpected error occurred while performing this action. Please try again.'
      );
    });
  });

  describe('getErrorSeverity', () => {
    it('should return HIGH for network errors', () => {
      const error = createMockNetworkError();
      expect(getErrorSeverity(error)).toBe(ERROR_SEVERITY.HIGH);
    });

    it('should return MEDIUM for auth errors', () => {
      const error = createMockApiError(401, 'Unauthorized');
      expect(getErrorSeverity(error)).toBe(ERROR_SEVERITY.MEDIUM);
    });

    it('should return HIGH for server errors', () => {
      const error = createMockApiError(500, 'Server Error');
      expect(getErrorSeverity(error)).toBe(ERROR_SEVERITY.HIGH);
    });

    it('should return LOW for client errors', () => {
      const error = createMockApiError(400, 'Bad Request');
      expect(getErrorSeverity(error)).toBe(ERROR_SEVERITY.LOW);
    });

    it('should return MEDIUM for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(getErrorSeverity(error)).toBe(ERROR_SEVERITY.MEDIUM);
    });
  });

  describe('logError', () => {
    it('should log to console in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = createMockApiError(400, 'Test error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logError(error, 'testing', ERROR_SEVERITY.MEDIUM);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MEDIUM] Error testing:',
        expect.objectContaining({
          timestamp: expect.any(String),
          context: 'testing',
          severity: ERROR_SEVERITY.MEDIUM,
          message: 'Test error',
          stack: expect.any(String),
          url: 'http://localhost:3000/test',
          userAgent: 'Test User Agent',
          response: expect.any(Object),
          status: 400,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not log to console in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = createMockApiError(400, 'Test error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logError(error, 'testing', ERROR_SEVERITY.MEDIUM);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors without response', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Network error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logError(error, 'network test', ERROR_SEVERITY.HIGH);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HIGH] Error network test:',
        expect.objectContaining({
          context: 'network test',
          severity: ERROR_SEVERITY.HIGH,
          message: 'Network error',
          response: undefined,
          status: undefined,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleApiError', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should handle network errors correctly', () => {
      const error = createMockNetworkError();
      const result = handleApiError(error, 'fetching data');

      expect(result).toEqual({
        message:
          'Unable to connect to the server. Please check your internet connection and try again.',
        shouldLogout: false,
        severity: ERROR_SEVERITY.HIGH,
        isNetworkError: true,
        isServerError: false,
        isClientError: false,
        timestamp: expect.any(String),
      });
    });

    it('should handle auth errors and call logout', () => {
      const error = createMockApiError(401, 'Token expired. Please log in again.');
      const mockLogout = jest.fn();
      const result = handleApiError(error, 'accessing resource', mockLogout);
 
      expect(result).toEqual({
        message: 'Token expired. Please log in again.',
        shouldLogout: true,
        severity: ERROR_SEVERITY.MEDIUM,
        isNetworkError: false,
        isServerError: false,
        isClientError: false,
        timestamp: expect.any(String),
      });
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should handle auth errors without logout function', () => {
      const error = createMockApiError(401, 'Unauthorized');
      const result = handleApiError(error, 'accessing resource');

      expect(result.shouldLogout).toBe(true);
    });

    it('should handle server errors correctly', () => {
      const error = createMockApiError(500, 'Internal Server Error');
      const result = handleApiError(error, 'processing request');

      expect(result).toEqual({
        message:
          'The server is currently experiencing issues. Please try again in a few moments.',
        shouldLogout: false,
        severity: ERROR_SEVERITY.HIGH,
        isNetworkError: false,
        isServerError: true,
        isClientError: false,
        timestamp: expect.any(String),
      });
    });

    it('should handle client errors correctly', () => {
      const error = createMockApiError(400, 'Validation failed');
      const result = handleApiError(error, 'submitting form');

      expect(result).toEqual({
        message: 'Validation failed',
        shouldLogout: false,
        severity: ERROR_SEVERITY.LOW,
        isNetworkError: false,
        isServerError: false,
        isClientError: true,
        timestamp: expect.any(String),
      });
    });

    it('should include timestamp in ISO format', () => {
      const result = handleApiError(
        createMockApiError(400, 'Test error'),
        'testing'
      );
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });
});
