import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { ErrorProvider } from '../../context/ErrorContext';

/**
 * Custom render function that wraps components with all necessary providers
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authValue - Custom AuthContext value
 * @param {Object} options.projectValue - Custom ProjectContext value
 * @param {Object} options.errorValue - Custom ErrorContext value
 * @param {boolean} options.withRouter - Whether to wrap with BrowserRouter (default: true)
 * @param {Object} options.renderOptions - Additional options for RTL render
 * @returns {Object} RTL render result with additional utilities
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    authValue,
    projectValue,
    errorValue,
    withRouter = true,
    ...renderOptions
  } = options;

  const AllProviders = ({ children }) => {
    let wrapped = (
      <ErrorProvider value={errorValue}>
        <AuthProvider value={authValue}>
          <ProjectProvider value={projectValue}>{children}</ProjectProvider>
        </AuthProvider>
      </ErrorProvider>
    );

    if (withRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
    }

    return wrapped;
  };

  const renderResult = render(ui, { wrapper: AllProviders, ...renderOptions });

  return {
    ...renderResult,
    user: userEvent.setup(),
  };
};

/**
 * Render component with minimal providers (useful for isolated unit tests)
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} RTL render result with user event setup
 */
export const renderWithMinimalProviders = (ui, options = {}) => {
  const { withRouter = false, ...renderOptions } = options;

  const wrapper = withRouter
    ? ({ children }) => <BrowserRouter>{children}</BrowserRouter>
    : undefined;

  const renderResult = render(ui, { wrapper, ...renderOptions });

  return {
    ...renderResult,
    user: userEvent.setup(),
  };
};

// Test Data Factories

/**
 * Create mock user data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user object
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Create mock project data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock project object
 */
export const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  name: 'Test Project',
  description: 'Test project description',
  userId: 'user-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Create mock task data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock task object
 */
export const createMockTask = (overrides = {}) => ({
  id: 'task-123',
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  priority: 'medium',
  projectId: 'project-123',
  userId: 'user-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Create mock API error with processed error structure
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} severity - Error severity level
 * @returns {Error} Mock API error object that can be used with mockRejectedValue
 */
export const createMockApiError = (
  status = 400,
  message = 'API Error',
  severity = 'medium'
) => {
  const error = new Error(message);
  error.response = {
    status,
    data: {
      message,
      status,
    },
  };
  error.processedError = {
    message,
    severity,
    isNetworkError: false,
    statusCode: status,
  };
  return error;
};

/**
 * Create mock network error
 * @param {string} message - Error message
 * @returns {Error} Mock network error
 */
export const createMockNetworkError = (message = 'Network Error') => {
  const error = new Error(message);
  error.processedError = {
    message: 'Network error occurred. Please check your connection.',
    severity: 'high',
    isNetworkError: true,
  };
  return error;
};

/**
 * Create mock authentication response
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock auth response
 */
export const createMockAuthResponse = (overrides = {}) => ({
  message: 'Login successful.',
  token: 'mock-jwt-token',
  user: createMockUser(),
  ...overrides,
});

// Common Assertion Helpers

/**
 * Assert that loading state is displayed
 * @param {HTMLElement} container - Container element
 * @param {string} buttonText - Expected button text during loading
 */
export const expectLoadingState = (container, buttonText = 'Loading...') => {
  const button = container.querySelector('button[disabled]');
  expect(button).toBeInTheDocument();
  if (buttonText) {
    expect(button).toHaveTextContent(buttonText);
  }
};

/**
 * Assert that error message is displayed
 * @param {string} message - Expected error message
 */
export const expectErrorMessage = (message) => {
  expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
};

/**
 * Assert that success message is displayed
 * @param {string} message - Expected success message
 */
export const expectSuccessMessage = (message) => {
  expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
};

/**
 * Wait for element to be removed from DOM
 * @param {Function} queryFn - Query function that should return null when element is removed
 * @param {Object} options - waitFor options
 */
export const waitForElementToBeRemoved = async (queryFn, options = {}) => {
  await waitFor(() => {
    expect(queryFn()).not.toBeInTheDocument();
  }, options);
};

// Form Testing Helpers

/**
 * Fill form inputs with provided data
 * @param {Object} user - userEvent instance
 * @param {Object} formData - Object with input labels as keys and values to type
 */
export const fillForm = async (user, formData) => {
  for (const [label, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(label, 'i'));
    await user.clear(input);
    await user.type(input, value);
  }
};

/**
 * Submit form by clicking submit button
 * @param {Object} user - userEvent instance
 * @param {string} buttonText - Submit button text (default: 'Submit')
 */
export const submitForm = async (user, buttonText = 'Submit') => {
  const submitButton = screen.getByRole('button', {
    name: new RegExp(buttonText, 'i'),
  });
  await user.click(submitButton);
};

// Cleanup Utilities

/**
 * Clear all mocks and reset state
 */
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

/**
 * Setup common test environment
 * @returns {Object} Common test setup objects
 */
export const setupTest = () => {
  // Mock console.error to prevent test output noise
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  return {
    consoleSpy,
    cleanup: () => {
      consoleSpy.mockRestore();
      cleanupMocks();
    },
  };
};

// Navigation Helpers

/**
 * Create mock navigate function
 * @returns {jest.Mock} Mocked navigate function
 */
export const createMockNavigate = () => jest.fn();

/**
 * Setup react-router-dom mocks
 * @returns {Object} Mock functions
 */
export const setupRouterMocks = () => {
  const mockNavigate = createMockNavigate();

  // Note: jest.mock() should be called at the top level of test files
  // This function is for reference - actual mocking should be done in test files

  return { mockNavigate };
};
