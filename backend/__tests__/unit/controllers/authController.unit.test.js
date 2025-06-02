const { registerUser, loginUser } = require('../../../controllers/authController');
const { User } = require('../../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Store original environment variables
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('registerUser', () => {
    it('should use correct bcrypt salt rounds from environment configuration', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      process.env.BCRYPT_SALT_ROUNDS = '10';
      bcrypt.hash.mockResolvedValue('hashedpassword');
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };
      User.create.mockResolvedValue(mockUser);

      // Act
      await registerUser(mockReq, mockRes);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully.',
        userId: 'user-123',
      });
    });

    it('should handle bcrypt library failure during password hashing', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const bcryptError = new Error('Bcrypt library failure');
      bcrypt.hash.mockRejectedValue(bcryptError);

      // Act
      await registerUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error during registration.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Registration error:',
        bcryptError
      );
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should handle JWT_SECRET environment variable validation', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      process.env.JWT_SECRET = undefined;

      // Act
      await loginUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server configuration error.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '🔥 JWT_SECRET environment variable not set!'
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT library failure during token generation', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      process.env.JWT_SECRET = 'valid-secret';
      const jwtError = new Error('JWT library failure');
      jwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      // Act
      await loginUser(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error during login.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', jwtError);
    });
  });
});
