import * as authApiService from '../../../services/authApiService';
import { authApiMocks, errorApiMocks } from '../../helpers/api-mocks';

// Mock the apiClient
jest.mock('../../../services/apiClient', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('authApiService Unit Tests', () => {
  let mockApi;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = require('../../../services/apiClient').api;
  });

  describe('loginUser', () => {
    test('returns auth response on successful login with username', async () => {
      // Arrange
      const loginData = { username: 'testuser', password: 'password123' };
      const authResponse = authApiMocks.loginSuccess();
      mockApi.post.mockResolvedValue({ data: authResponse });

      // Act
      const result = await authApiService.loginUser(loginData);

      // Assert
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/login',
        loginData,
        'logging in'
      );
      expect(result).toEqual(authResponse);
    });

    test('returns auth response on successful login with email', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'password123' };
      const authResponse = authApiMocks.loginWithEmail();
      mockApi.post.mockResolvedValue({ data: authResponse });

      // Act
      const result = await authApiService.loginUser(loginData);

      // Assert
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/login',
        loginData,
        'logging in'
      );
      expect(result).toEqual(authResponse);
    });

    test('throws error when login fails', async () => {
      // Arrange
      const loginData = { username: 'wronguser', password: 'wrongpass' };
      const apiError = authApiMocks.invalidCredentials();
      mockApi.post.mockRejectedValue(apiError);

      // Act & Assert
      await expect(authApiService.loginUser(loginData)).rejects.toThrow(
        'Invalid credentials.'
      );
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/login',
        loginData,
        'logging in'
      );
    });
  });

  describe('registerUser', () => {
    test('returns auth response on successful registration', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const authResponse = authApiMocks.registerSuccess();
      mockApi.post.mockResolvedValue({ data: authResponse });

      // Act
      const result = await authApiService.registerUser(registerData);

      // Assert
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData,
        'registering user'
      );
      expect(result).toEqual(authResponse);
    });

    test('throws error when registration fails', async () => {
      // Arrange
      const registerData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };
      const apiError = authApiMocks.userExists();
      mockApi.post.mockRejectedValue(apiError);

      // Act & Assert
      await expect(authApiService.registerUser(registerData)).rejects.toThrow(
        'User already exists.'
      );
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData,
        'registering user'
      );
    });
  });

  describe('logoutUser', () => {
    test('returns success message on logout', async () => {
      // Act
      const result = await authApiService.logoutUser();

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('error handling', () => {
    test('handles validation errors properly', async () => {
      // Arrange
      const loginData = { username: 'test', password: 'test' };
      const apiError = authApiMocks.validationError('Invalid password format');
      mockApi.post.mockRejectedValue(apiError);

      // Act & Assert
      await expect(authApiService.loginUser(loginData)).rejects.toThrow(
        'Invalid password format'
      );
    });

    test('handles network errors properly', async () => {
      // Arrange
      const loginData = { username: 'test', password: 'test' };
      const networkError = errorApiMocks.networkError();
      mockApi.post.mockRejectedValue(networkError);

      // Act & Assert
      await expect(authApiService.loginUser(loginData)).rejects.toThrow(
        'Network Error'
      );
    });
  });
});
