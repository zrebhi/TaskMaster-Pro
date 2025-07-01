import { createMockUser, createMockProject } from './test-utils';

// AuthContext Mock Factories

/**
 * Create mock AuthContext value
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock AuthContext value
 */
export const createMockAuthContext = (overrides = {}) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  ...overrides,
});

/**
 * Create authenticated AuthContext value
 * @param {Object} userOverrides - User data overrides
 * @param {Object} contextOverrides - Context method overrides
 * @returns {Object} Mock authenticated AuthContext value
 */
export const createAuthenticatedContext = (
  userOverrides = {},
  contextOverrides = {}
) => ({
  token: 'mock-jwt-token',
  user: createMockUser(userOverrides),
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  ...contextOverrides,
});

/**
 * Create unauthenticated AuthContext value
 * @param {Object} overrides - Context method overrides
 * @returns {Object} Mock unauthenticated AuthContext value
 */
export const createUnauthenticatedContext = (overrides = {}) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  ...overrides,
});

// ProjectContext Mock Factories

/**
 * Create mock ProjectContext value
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock ProjectContext value
 */
export const createMockProjectContext = (overrides = {}) => ({
  projects: [],
  isLoading: false,
  error: null,
  fetchProjects: jest.fn(),
  addProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  ...overrides,
});

/**
 * Create ProjectContext with projects loaded
 * @param {Array} projects - Array of project objects
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock ProjectContext with projects
 */
export const createProjectContextWithProjects = (
  projects,
  overrides = {}
) => {
  const mockProjects =
    projects !== undefined
      ? projects
      : [
          createMockProject(),
          createMockProject({ id: 'project-456', name: 'Second Project' }),
        ];

  return createMockProjectContext({
    projects: mockProjects,
    ...overrides,
  });
};

/**
 * Create ProjectContext in loading state
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock ProjectContext in loading state
 */
export const createLoadingProjectContext = (overrides = {}) => {
  let resolveFetchProjectsPromise;
  const fetchProjectsPromise = new Promise((resolve) => {
    resolveFetchProjectsPromise = resolve;
  });

  return createMockProjectContext({
    isLoading: true,
    fetchProjects: jest.fn(() => fetchProjectsPromise),
    _resolveFetchProjects: resolveFetchProjectsPromise, // Expose the resolver
    ...overrides,
  });
};

/**
 * Create ProjectContext with error state
 * @param {string} errorMessage - Error message
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock ProjectContext with error
 */
export const createErrorProjectContext = (
  errorMessage = 'Failed to load projects',
  overrides = {}
) =>
  createMockProjectContext({
    error: errorMessage,
    ...overrides,
  });

// TaskContext Mock Factories

/**
 * Create mock TaskContext value
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock TaskContext value
 */
export const createMockTaskContext = (overrides = {}) => ({
  tasks: [],
  isLoadingTasks: false,
  taskError: null,
  fetchTasks: jest.fn(),
  addTask: jest.fn(),
  updateTask: jest.fn(),
  patchTask: jest.fn(),
  deleteTask: jest.fn(),
  currentProjectIdForTasks: null,
  clearTasks: jest.fn(),
  ...overrides,
});

/**
 * Create TaskContext with tasks loaded
 * @param {Array} tasks - Array of task objects
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock TaskContext with tasks
 */
export const createTaskContextWithTasks = (tasks = [], overrides = {}) =>
  createMockTaskContext({
    tasks,
    currentProjectIdForTasks: 'project-123',
    ...overrides,
  });

/**
 * Create TaskContext in loading state
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock TaskContext in loading state
 */
export const createLoadingTaskContext = (overrides = {}) =>
  createMockTaskContext({
    isLoadingTasks: true,
    ...overrides,
  });

/**
 * Create TaskContext with error state
 * @param {string} errorMessage - Error message
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock TaskContext with error
 */
export const createErrorTaskContext = (
  errorMessage = 'Failed to load tasks',
  overrides = {}
) =>
  createMockTaskContext({
    taskError: errorMessage,
    ...overrides,
  });

// ErrorContext Mock Factories

/**
 * Create mock ErrorContext value
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock ErrorContext value
 */
export const createMockErrorContext = (overrides = {}) => ({
  globalErrors: [],
  isOnline: true,
  addError: jest.fn(),
  removeError: jest.fn(),
  clearAllErrors: jest.fn(),
  showErrorToast: jest.fn(),
  showSuccess: jest.fn(),
  showInfo: jest.fn(),
  ...overrides,
});

/**
 * Create ErrorContext with offline state
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock ErrorContext in offline state
 */
export const createOfflineErrorContext = (overrides = {}) =>
  createMockErrorContext({
    isOnline: false,
    ...overrides,
  });

/**
 * Create ErrorContext with global errors
 * @param {Array} errors - Array of error objects
 * @param {Object} overrides - Additional context overrides
 * @returns {Object} Mock ErrorContext with errors
 */
export const createErrorContextWithErrors = (errors = [], overrides = {}) =>
  createMockErrorContext({
    globalErrors: errors,
    ...overrides,
  });

// Provider Wrapper Components

/**
 * Test wrapper for AuthContext
 * @param {{ children: React.ReactNode, value?: object }} props The component props.
 * @returns {import('react').JSX.Element} AuthContext provider wrapper.
 */
export const TestAuthProvider = ({ children, value }) => {
  const AuthContext = require('../../context/AuthContext').default;
  const mockValue = value || createMockAuthContext();

  return (
    <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
  );
};

/**
 * Test wrapper for ProjectContext
 * @param {{ children: React.ReactNode, value?: object }} props The component props.
 * @returns {import('react').JSX.Element} AuthContext provider wrapper.
 */
export const TestProjectProvider = ({ children, value }) => {
  const ProjectContext = require('../../context/ProjectContext').default;
  const mockValue = value || createMockProjectContext();

  return (
    <ProjectContext.Provider value={mockValue}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * Test wrapper for TaskContext
 * @param {{ children: React.ReactNode, value?: object }} props The component props.
 * @returns {import('react').JSX.Element} AuthContext provider wrapper.
 */
export const TestTaskProvider = ({ children, value }) => {
  const TaskContext = require('../../context/TaskContext').default;
  const mockValue = value || createMockTaskContext();

  return (
    <TaskContext.Provider value={mockValue}>{children}</TaskContext.Provider>
  );
};

/**
 * Test wrapper for ErrorContext
 * @param {{ children: React.ReactNode, value?: object }} props The component props.
 * @returns {import('react').JSX.Element} AuthContext provider wrapper.
 */
export const TestErrorProvider = ({ children, value }) => {
  const ErrorContext = require('../../context/ErrorContext').default;
  const mockValue = value || createMockErrorContext();

  return (
    <ErrorContext.Provider value={mockValue}>{children}</ErrorContext.Provider>
  );
};

/**
 * Combined test provider wrapper
* @param {{
  *  children: React.ReactNode,
  *  authValue?: object,
  *  projectValue?: object,
  *  taskValue?: object,
  *  errorValue?: object
  * }} props The component props.
  * @returns {import('react').JSX.Element} Combined provider wrapper.
 */
export const TestProviders = ({
  children,
  authValue,
  projectValue,
  taskValue,
  errorValue,
}) => (
  <TestErrorProvider value={errorValue}>
    <TestAuthProvider value={authValue}>
      <TestProjectProvider value={projectValue}>
        <TestTaskProvider value={taskValue}>{children}</TestTaskProvider>
      </TestProjectProvider>
    </TestAuthProvider>
  </TestErrorProvider>
);

// SessionStorage Mock Utilities

/**
 * Create sessionStorage mock
 * @returns {Object} SessionStorage mock object
 */
export const createSessionStorageMock = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
});

/**
 * Setup sessionStorage mock with initial values
 * @param {Object} initialValues - Initial sessionStorage values
 * @returns {Object} SessionStorage mock with setup
 */
export const setupSessionStorageMock = (initialValues = {}) => {
  const sessionStorageMock = createSessionStorageMock();

  sessionStorageMock.getItem.mockImplementation((key) => {
    if (key === 'token' && initialValues.token !== undefined) {
      return initialValues.token;
    }
    if (key === 'user' && initialValues.user !== undefined) {
      return JSON.stringify(initialValues.user);
    }
    return null;
  });

  // Replace global sessionStorage
  const originalSessionStorage = global.sessionStorage;
  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  return {
    sessionStorageMock,
    restore: () => {
      Object.defineProperty(global, 'sessionStorage', {
        value: originalSessionStorage,
        writable: true,
      });
    },
  };
};

// Common Mock Scenarios

/**
 * Setup authenticated user scenario
 * @param {Object} userOverrides - User data overrides
 * @returns {Object} Complete authenticated scenario setup
 */
export const setupAuthenticatedScenario = (userOverrides = {}) => {
  const user = createMockUser(userOverrides);
  const token = 'mock-jwt-token';

  const authContext = createAuthenticatedContext({ ...user });
  const sessionStorage = setupSessionStorageMock({ token, user });

  return {
    user,
    token,
    authContext,
    sessionStorage,
    cleanup: sessionStorage.restore,
  };
};

/**
 * Setup project management scenario
 * @param {Array} projects - Initial projects
 * @param {Object} authOverrides - Auth context overrides
 * @returns {Object} Complete project scenario setup
 */
export const setupProjectScenario = (projects = [], authOverrides = {}) => {
  const authContext = createAuthenticatedContext({}, authOverrides);
  const projectContext = createProjectContextWithProjects(projects);
  const errorContext = createMockErrorContext();

  return {
    authContext,
    projectContext,
    errorContext,
    projects: projectContext.projects,
  };
};

