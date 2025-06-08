const {
  globalErrorHandler,
  notFoundHandler,
  logError,
} = require('../../../middleware/errorHandler');
const { AppError } = require('../../../utils/customErrors');
const { createMockReqResNext } = require('../../helpers/unitTestHelpers');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    const mocks = createMockReqResNext({
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      user: { userId: 'test-user-id' },
    });

    mockReq = mocks.mockReq;
    mockRes = mocks.mockRes;
    mockNext = mocks.mockNext;

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper functions
  const expectErrorResponse = (mockRes, statusCode, expectedResponse) => {
    expect(mockRes.status).toHaveBeenCalledWith(statusCode);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining(expectedResponse)
    );
  };

  const expectLogCall = (spy, level, expectedLog) => {
    expect(spy).toHaveBeenCalledWith(
      level,
      expect.objectContaining(expectedLog)
    );
  };

  const createJWTError = (name, message) => {
    const error = new Error(message);
    error.name = name;
    return error;
  };

  const createSequelizeError = (name, message, errors = []) => {
    const error = new Error(message);
    error.name = name;
    error.errors = errors;
    return error;
  };

  const testGlobalErrorHandler = (error, expectedStatus, expectedResponse) => {
    globalErrorHandler(error, mockReq, mockRes, mockNext);
    expectErrorResponse(mockRes, expectedStatus, expectedResponse);
  };

  describe('logError', () => {
    const baseLogExpectation = {
      timestamp: expect.any(String),
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      userAgent: 'test-user-agent',
      userId: 'test-user-id',
    };

    test('logs server errors with error level', () => {
      const error = new AppError('Server error', 500, 'SERVER_ERROR');

      logError(error, mockReq);

      expectLogCall(consoleErrorSpy, '🚨 SERVER ERROR:', {
        ...baseLogExpectation,
        error: expect.objectContaining({
          name: 'Error',
          message: 'Server error',
          statusCode: 500,
          errorCode: 'SERVER_ERROR',
          stack: expect.any(String),
        }),
      });
    });

    test('logs client errors with warn level', () => {
      const error = new AppError('Bad request', 400, 'BAD_REQUEST');

      logError(error, mockReq);

      expectLogCall(consoleWarnSpy, '⚠️ CLIENT ERROR:', {
        ...baseLogExpectation,
        error: expect.objectContaining({
          name: 'Error',
          message: 'Bad request',
          statusCode: 400,
          errorCode: 'BAD_REQUEST',
        }),
      });
    });

    test('logs info level for status codes below 400', () => {
      const error = new Error('Info message');
      error.statusCode = 200;

      logError(error, mockReq);

      expectLogCall(consoleInfoSpy, 'ℹ️ INFO:', {
        ...baseLogExpectation,
        error: expect.objectContaining({
          name: 'Error',
          message: 'Info message',
          statusCode: 200,
        }),
      });
    });

    // eslint-disable-next-line jest/expect-expect
    test('handles request without user', () => {
      const error = new AppError('Server error', 500, 'SERVER_ERROR');
      mockReq.user = undefined;

      logError(error, mockReq);

      expectLogCall(consoleErrorSpy, '🚨 SERVER ERROR:', {
        ...baseLogExpectation,
        userId: undefined,
      });
    });
  });

  describe('notFoundHandler', () => {
    test('creates 404 error for undefined routes', () => {
      mockReq.originalUrl = '/api/nonexistent';

      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route /api/nonexistent not found',
          statusCode: 404,
          errorCode: 'ROUTE_NOT_FOUND',
          isOperational: true,
        })
      );
    });
  });

  describe('globalErrorHandler', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('handles AppError in development mode', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      globalErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Test error',
          errorCode: 'TEST_ERROR',
          timestamp: expect.any(String),
          error: expect.objectContaining({
            message: 'Test error',
            statusCode: 400,
            errorCode: 'TEST_ERROR',
          }),
        })
      );
    });

    test('handles generic error with default status code', () => {
      const error = new Error('Generic error');

      globalErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Generic error',
        })
      );
    });

    describe('JWT error handling', () => {
      const jwtTestCases = [
        {
          name: 'JsonWebTokenError',
          message: 'Invalid token',
          expectedMessage: 'Invalid token. Please log in again.',
          expectedCode: 'INVALID_TOKEN',
        },
        {
          name: 'TokenExpiredError',
          message: 'Token expired',
          expectedMessage: 'Your session has expired. Please log in again.',
          expectedCode: 'TOKEN_EXPIRED',
        },
        {
          name: 'NotBeforeError',
          message: 'JWT not active yet',
          expectedMessage: 'Authentication failed. Please log in again.',
          expectedCode: 'AUTH_FAILED',
        },
      ];

      jwtTestCases.forEach(
        ({ name, message, expectedMessage, expectedCode }) => {
          // eslint-disable-next-line jest/expect-expect
          test(`handles ${name}`, () => {
            const jwtError = createJWTError(name, message);

            testGlobalErrorHandler(jwtError, 401, {
              status: 'error',
              message: expectedMessage,
              errorCode: expectedCode,
            });
          });
        }
      );
    });

    describe('Sequelize error handling', () => {
      // eslint-disable-next-line jest/expect-expect
      test('handles validation errors', () => {
        const sequelizeError = createSequelizeError(
          'SequelizeValidationError',
          'Validation failed',
          [{ message: 'Name is required' }, { message: 'Email must be valid' }]
        );

        testGlobalErrorHandler(sequelizeError, 400, {
          status: 'error',
          message: 'Name is required Email must be valid',
          errorCode: 'VALIDATION_ERROR',
        });
      });

      // eslint-disable-next-line jest/expect-expect
      test('handles unique constraint errors', () => {
        const uniqueError = createSequelizeError(
          'SequelizeUniqueConstraintError',
          'Unique constraint failed',
          [{ path: 'email', value: 'test@example.com' }]
        );

        testGlobalErrorHandler(uniqueError, 409, {
          status: 'error',
          message: "email 'test@example.com' already exists",
          errorCode: 'CONFLICT_ERROR',
        });
      });

      // eslint-disable-next-line jest/expect-expect
      test('handles other database errors', () => {
        const dbError = createSequelizeError(
          'SequelizeDatabaseError',
          'Database error'
        );

        testGlobalErrorHandler(dbError, 500, {
          status: 'error',
          message: 'Database operation failed',
          errorCode: 'DATABASE_ERROR',
        });
      });
    });

    // eslint-disable-next-line jest/expect-expect
    test('handles express-validator validation errors', () => {
      const validationError = createSequelizeError(
        'ValidationError',
        'Validation failed',
        [{ msg: 'Email is required' }, { msg: 'Password too short' }]
      );

      testGlobalErrorHandler(validationError, 400, {
        status: 'error',
        message: 'Email is required Password too short',
        errorCode: 'VALIDATION_ERROR',
      });
    });

    describe('status code handling', () => {
      // eslint-disable-next-line jest/expect-expect
      test('handles error without statusCode in development', () => {
        const error = new Error('Error without status code');

        testGlobalErrorHandler(error, 500, {
          status: 'error',
          message: 'Error without status code',
        });
      });

      // eslint-disable-next-line jest/expect-expect
      test('handles error with falsy statusCode in development', () => {
        const error = new Error('Error with falsy status code');
        error.statusCode = 0;

        testGlobalErrorHandler(error, 500, {
          status: 'error',
          message: 'Error with falsy status code',
        });
      });
    });

    describe('production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      test('handles operational errors in production', () => {
        const error = new AppError('User not found', 404, 'USER_NOT_FOUND');

        testGlobalErrorHandler(error, 404, {
          status: 'error',
          message: 'User not found',
          errorCode: 'USER_NOT_FOUND',
          timestamp: expect.any(String),
        });
      });

      test('handles operational errors without timestamp in production', () => {
        const error = new AppError('User not found', 404, 'USER_NOT_FOUND');
        delete error.timestamp;

        testGlobalErrorHandler(error, 404, {
          status: 'error',
          message: 'User not found',
          errorCode: 'USER_NOT_FOUND',
          timestamp: expect.any(String),
        });
      });

      test('handles non-operational errors in production', () => {
        const error = new Error('Database connection failed');
        error.isOperational = false;

        testGlobalErrorHandler(error, 500, {
          status: 'error',
          message: 'Something went wrong on our end. Please try again later.',
          errorCode: 'INTERNAL_SERVER_ERROR',
          timestamp: expect.any(String),
        });

        expectLogCall(consoleErrorSpy, 'ERROR:', {
          message: error.message,
          isOperational: false,
        });
      });
    });
  });
});
