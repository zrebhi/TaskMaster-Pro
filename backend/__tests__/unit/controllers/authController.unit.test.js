const {
  registerUser,
  loginUser,
} = require('../../../controllers/authController');
const { User } = require('../../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createMockUser,
  setupJWTMocks,
  createMockReqResNext,
} = require('../../helpers/unitTestHelpers');

jest.mock('../../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

jest.mock('../../../utils/customErrors', () => {
  const actual = jest.requireActual('../../../utils/customErrors');
  return {
    ...actual,
    asyncHandler: (fn) => fn,
  };
});

describe('Auth Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let originalEnv;

  const setupSuccessfulLogin = (userOverrides = {}) => {
    const mockUser = createMockUser(userOverrides);
    const { mockToken, mockDecodedToken } = setupJWTMocks();

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    return { mockUser, mockToken, mockDecodedToken };
  };

  const setupLoginUntilAuth = () => {
    const mockUser = createMockUser();
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    return mockUser;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ({ mockReq, mockRes, mockNext } = createMockReqResNext());

    originalEnv = { ...process.env };
    process.env.BCRYPT_SALT_ROUNDS = '12';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  const testRegisterValidation = () => {
    describe('validation errors', () => {
      it('should throw ValidationError when required fields are missing', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
        };

        await expect(registerUser(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Please provide username, email, and password.',
            statusCode: 400,
            errorCode: 'VALIDATION_ERROR',
          })
        );
      });

      it('should throw ValidationError for invalid username format', async () => {
        mockReq.body = {
          username: 'invalid@username',
          email: 'test@example.com',
          password: 'password123',
        };

        await expect(registerUser(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message:
              'Username can only contain letters, numbers, underscores, and hyphens.',
            statusCode: 400,
            errorCode: 'VALIDATION_ERROR',
          })
        );
      });

      it('should throw ValidationError for short password', async () => {
        mockReq.body = {
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        };

        await expect(registerUser(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Password must be at least 6 characters long.',
            statusCode: 400,
            errorCode: 'VALIDATION_ERROR',
          })
        );
      });
    });
  };

  const testConfigErrors = (controllerFn, setupFn) => {
    describe('configuration errors', () => {
      it('should throw AppError when JWT_SECRET is missing', async () => {
        delete process.env.JWT_SECRET;

        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
        };

        setupFn();

        await expect(controllerFn(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Server configuration error.',
            statusCode: 500,
            errorCode: 'CONFIG_ERROR',
          })
        );
      });

      it('should throw AppError when JWT_EXPIRES_IN is missing', async () => {
        delete process.env.JWT_EXPIRES_IN;

        mockReq.body = {
          email: 'test@example.com',
          password: 'password123',
        };

        setupFn();

        await expect(controllerFn(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Server configuration error.',
            statusCode: 500,
            errorCode: 'CONFIG_ERROR',
          })
        );
      });
    });
  };

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password_123';
      const mockUser = createMockUser();

      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(mockUser);

      await registerUser(mockReq, mockRes, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully.',
        userId: 'user-123',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    testRegisterValidation();

    it('should use default salt rounds when BCRYPT_SALT_ROUNDS is missing', async () => {
      delete process.env.BCRYPT_SALT_ROUNDS;

      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password_123';
      const mockUser = createMockUser();

      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(mockUser);

      await registerUser(mockReq, mockRes, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('loginUser', () => {
    it('should successfully login user with email and password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { mockToken, mockDecodedToken } = setupSuccessfulLogin();

      await loginUser(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed_password'
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', username: 'testuser' },
        'test-secret',
        { expiresIn: '1h', algorithm: 'HS256' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful.',
        token: mockToken,
        expiresAt: mockDecodedToken.exp,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should throw ValidationError when email/username and password are missing', async () => {
      mockReq.body = {
        password: 'password123',
      };

      await expect(loginUser(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'Please provide email or username, and password.',
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
        })
      );
    });

    it('should successfully login user with username and password', async () => {
      mockReq.body = {
        email: '',
        username: 'testuser',
        password: 'password123',
      };

      setupSuccessfulLogin();

      await loginUser(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });

      expect(User.findOne).not.toHaveBeenCalledWith({
        where: { email: expect.anything() },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw AuthenticationError when user is not found', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);

      await expect(loginUser(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid credentials.',
          statusCode: 401,
          errorCode: 'AUTHENTICATION_ERROR',
        })
      );
    });

    it('should throw AuthenticationError when password is incorrect', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = createMockUser();

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginUser(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid credentials.',
          statusCode: 401,
          errorCode: 'AUTHENTICATION_ERROR',
        })
      );
    });

    testConfigErrors(loginUser, setupLoginUntilAuth);
  });
});
