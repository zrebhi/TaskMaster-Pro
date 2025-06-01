import { api } from './apiClient';

/**
 * Authentication API service using centralized error handling
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @returns {Promise<Object>} Registration response
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData, 'registering user');
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} [credentials.email] - Email address (if using email login)
 * @param {string} [credentials.username] - Username (if using username login)
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials, 'logging in');
  return response.data;
};

/**
 * Logout user (placeholder for future backend implementation)
 * @returns {Promise<Object>} Logout response
 */
export const logoutUser = async () => {
  // TODO: Implement when backend logout endpoint is available
  // const response = await api.post('/auth/logout', {}, 'logging out');
  // return response.data;
  return Promise.resolve({ message: 'Logged out successfully' });
};
