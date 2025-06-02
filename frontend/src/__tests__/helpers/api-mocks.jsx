import {
  createMockUser,
  createMockProject,
  createMockTask,
  createMockApiError,
  createMockNetworkError,
} from './test-utils';

// API Response Mock Data

/**
 * Authentication API response mocks
 */
export const authApiMocks = {
  loginSuccess: (userOverrides = {}) => ({
    message: 'Login successful.',
    token: 'mock-jwt-token',
    user: createMockUser(userOverrides),
  }),

  loginWithEmail: (userOverrides = {}) => ({
    message: 'Login successful.',
    token: 'mock-jwt-token-email',
    user: createMockUser({
      email: 'email@example.com',
      username: 'emailuser',
      ...userOverrides,
    }),
  }),

  registerSuccess: (userOverrides = {}) => ({
    message: 'Registration successful.',
    token: 'mock-jwt-token-register',
    user: createMockUser({
      username: 'newuser',
      email: 'newuser@example.com',
      ...userOverrides,
    }),
  }),

  invalidCredentials: () =>
    createMockApiError(401, 'Invalid credentials.', 'medium'),

  userExists: () => createMockApiError(409, 'User already exists.', 'medium'),

  validationError: (message = 'Validation failed.') =>
    createMockApiError(400, message, 'medium'),
};

/**
 * Project API response mocks
 */
export const projectApiMocks = {
  getAllSuccess: (projects = []) => {
    const mockProjects =
      projects.length > 0
        ? projects
        : [
            createMockProject(),
            createMockProject({ id: 'project-456', name: 'Second Project' }),
          ];

    return {
      projects: mockProjects,
      total: mockProjects.length,
    };
  },

  createSuccess: (projectOverrides = {}) => ({
    project: createMockProject({
      name: 'New Project',
      ...projectOverrides,
    }),
  }),

  updateSuccess: (projectId = 'project-123', updates = {}) => ({
    project: createMockProject({
      id: projectId,
      name: 'Updated Project',
      ...updates,
    }),
  }),

  deleteSuccess: () => ({
    message: 'Project deleted successfully.',
  }),

  notFound: () => createMockApiError(404, 'Project not found.', 'medium'),

  unauthorized: () => createMockApiError(401, 'Unauthorized access.', 'high'),

  validationError: (message = 'Project validation failed.') =>
    createMockApiError(400, message, 'medium'),
};

/**
 * Task API response mocks
 */
export const taskApiMocks = {
  getAllSuccess: (tasks = []) => {
    const mockTasks =
      tasks.length > 0
        ? tasks
        : [
            createMockTask(),
            createMockTask({ id: 'task-456', title: 'Second Task' }),
          ];

    return {
      tasks: mockTasks,
      total: mockTasks.length,
    };
  },

  createSuccess: (taskOverrides = {}) => ({
    task: createMockTask({
      title: 'New Task',
      ...taskOverrides,
    }),
  }),

  updateSuccess: (taskId = 'task-123', updates = {}) => ({
    task: createMockTask({
      id: taskId,
      title: 'Updated Task',
      ...updates,
    }),
  }),

  deleteSuccess: () => ({
    message: 'Task deleted successfully.',
  }),

  notFound: () => createMockApiError(404, 'Task not found.', 'medium'),

  validationError: (message = 'Task validation failed.') =>
    createMockApiError(400, message, 'medium'),
};

/**
 * Common error response mocks
 */
export const errorApiMocks = {
  networkError: () => createMockNetworkError('Network Error'),

  serverError: () => createMockApiError(500, 'Internal server error.', 'high'),

  unauthorized: () => createMockApiError(401, 'Unauthorized.', 'high'),

  forbidden: () => createMockApiError(403, 'Forbidden.', 'high'),

  notFound: () => createMockApiError(404, 'Resource not found.', 'medium'),

  badRequest: (message = 'Bad request.') =>
    createMockApiError(400, message, 'medium'),

  timeout: () => {
    const error = new Error('Request timeout');
    error.code = 'ECONNABORTED';
    error.processedError = {
      message: 'Request timed out. Please try again.',
      severity: 'medium',
      isNetworkError: true,
    };
    return error;
  },
};

// API Client Mock Setup

/**
 * Create mock API client
 * @returns {Object} Mock API client with all HTTP methods
 */
export const createMockApiClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
});

/**
 * Setup API service mocks
 * @param {Object} scenarios - Mock scenarios to setup
 * @returns {Object} Mock functions and cleanup
 */
export const setupApiServiceMocks = (scenarios = {}) => {
  const mocks = {};

  // Auth service mocks
  if (scenarios.auth) {
    const {
      loginUser,
      registerUser,
    } = require('../../services/authApiService');
    mocks.loginUser = jest.mocked(loginUser);
    mocks.registerUser = jest.mocked(registerUser);
  }

  // Project service mocks
  if (scenarios.projects) {
    const {
      getAllProjects,
      createProjectAPI,
      updateProjectAPI,
      deleteProjectAPI,
    } = require('../../services/projectApiService');

    mocks.getAllProjects = jest.mocked(getAllProjects);
    mocks.createProjectAPI = jest.mocked(createProjectAPI);
    mocks.updateProjectAPI = jest.mocked(updateProjectAPI);
    mocks.deleteProjectAPI = jest.mocked(deleteProjectAPI);
  }

  // Task service mocks
  if (scenarios.tasks) {
    const {
      getTasksForProjectAPI,
      createTaskInProjectAPI,
    } = require('../../services/taskApiService');

    mocks.getTasksForProjectAPI = jest.mocked(getTasksForProjectAPI);
    mocks.createTaskInProjectAPI = jest.mocked(createTaskInProjectAPI);
  }

  return {
    mocks,
    cleanup: () => {
      Object.values(mocks).forEach((mock) => mock.mockReset());
    },
  };
};

// Mock Scenario Builders

/**
 * Setup successful authentication flow
 * @param {Object} userOverrides - User data overrides
 * @returns {Object} Auth flow mock setup
 */
export const setupSuccessfulAuthFlow = (userOverrides = {}) => {
  const { mocks } = setupApiServiceMocks({ auth: true });

  mocks.loginUser.mockResolvedValue(authApiMocks.loginSuccess(userOverrides));
  mocks.registerUser.mockResolvedValue(
    authApiMocks.registerSuccess(userOverrides)
  );

  return { mocks };
};

/**
 * Setup failed authentication flow
 * @param {string} errorType - Type of error ('credentials', 'network', 'validation')
 * @returns {Object} Auth error flow mock setup
 */
export const setupFailedAuthFlow = (errorType = 'credentials') => {
  const { mocks } = setupApiServiceMocks({ auth: true });

  const errorMap = {
    credentials: authApiMocks.invalidCredentials(),
    network: errorApiMocks.networkError(),
    validation: authApiMocks.validationError(),
    server: errorApiMocks.serverError(),
  };

  const error = errorMap[errorType] || errorMap.credentials;

  mocks.loginUser.mockRejectedValue(error);
  mocks.registerUser.mockRejectedValue(error);

  return { mocks, error };
};

/**
 * Setup successful project CRUD flow
 * @param {Array} initialProjects - Initial projects data
 * @returns {Object} Project CRUD mock setup
 */
export const setupSuccessfulProjectFlow = (initialProjects = []) => {
  const { mocks } = setupApiServiceMocks({ projects: true });

  mocks.getAllProjects.mockResolvedValue(
    projectApiMocks.getAllSuccess(initialProjects).projects
  );
  mocks.createProjectAPI.mockResolvedValue(
    projectApiMocks.createSuccess().project
  );
  mocks.updateProjectAPI.mockResolvedValue(
    projectApiMocks.updateSuccess().project
  );
  mocks.deleteProjectAPI.mockResolvedValue(projectApiMocks.deleteSuccess());

  return { mocks };
};

/**
 * Setup project error scenarios
 * @param {string} errorType - Type of error
 * @returns {Object} Project error mock setup
 */
export const setupProjectErrorFlow = (errorType = 'network') => {
  const { mocks } = setupApiServiceMocks({ projects: true });

  const errorMap = {
    network: errorApiMocks.networkError(),
    unauthorized: projectApiMocks.unauthorized(),
    notFound: projectApiMocks.notFound(),
    validation: projectApiMocks.validationError(),
    server: errorApiMocks.serverError(),
  };

  const error = errorMap[errorType] || errorMap.network;

  // Apply error to all project operations
  Object.values(mocks).forEach((mock) => {
    mock.mockRejectedValue(error);
  });

  return { mocks, error };
};

/**
 * Reset all API mocks
 */
export const resetApiMocks = () => {
  jest.clearAllMocks();
};

/**
 * Setup loading state simulation
 * @param {Object} mocks - Mock functions to setup
 * @param {number} delay - Delay in milliseconds
 */
export const setupLoadingSimulation = (mocks) => {
  Object.values(mocks).forEach((mock) => {
    mock.mockImplementation(() => new Promise(() => {})); // Never resolves
  });
};
