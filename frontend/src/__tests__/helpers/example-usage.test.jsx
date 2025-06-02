/**
 * Example test file demonstrating usage of the new test utilities
 * This file shows how to use the centralized test helpers and can be removed
 * once the actual test migration is complete.
 */

import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import test utilities
import {
  renderWithProviders,
  renderWithMinimalProviders,
  createMockUser,
  createMockProject,
  createMockApiError,
  expectLoadingState,
  expectErrorMessage,
  fillForm,
  submitForm,
  setupTest,
} from './test-utils';

// Import mock providers
import {
  createAuthenticatedContext,
  createMockProjectContext,
  createMockErrorContext,
  TestAuthProvider,
  setupAuthenticatedScenario,
} from './mock-providers';

// Import API mocks
import { authApiMocks, projectApiMocks, resetApiMocks } from './api-mocks';

// Simple test component for demonstration
const TestComponent = ({ showError = false, showLoading = false }) => (
  <div>
    <h1>Test Component</h1>
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" type="email" />
      <label htmlFor="password">Password:</label>
      <input id="password" type="password" />
      <button type="submit" disabled={showLoading}>
        {showLoading ? 'Loading...' : 'Submit'}
      </button>
    </form>
    {showError ? <div>An error occurred</div> : null}
  </div>
);

describe('Test Utilities Example Usage', () => {
  let cleanup;

  beforeEach(() => {
    const testSetup = setupTest();
    cleanup = testSetup.cleanup;
    resetApiMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('renderWithProviders', () => {
    test('renders component with all providers', () => {
      const authContext = createAuthenticatedContext();
      const projectContext = createMockProjectContext();
      const errorContext = createMockErrorContext();

      const { user } = renderWithProviders(<TestComponent />, {
        authValue: authContext,
        projectValue: projectContext,
        errorValue: errorContext,
      });

      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(user).toBeDefined();
    });

    test('renders component without router when specified', () => {
      renderWithProviders(<TestComponent />, {
        withRouter: false,
      });

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('renderWithMinimalProviders', () => {
    test('renders component with minimal setup', () => {
      const { user } = renderWithMinimalProviders(<TestComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(user).toBeDefined();
    });
  });

  describe('Test Data Factories', () => {
    test('createMockUser creates user with defaults and overrides', () => {
      const defaultUser = createMockUser();
      expect(defaultUser).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      const customUser = createMockUser({ username: 'customuser' });
      expect(customUser.username).toBe('customuser');
      expect(customUser.email).toBe('test@example.com'); // Default preserved
    });

    test('createMockProject creates project with defaults and overrides', () => {
      const project = createMockProject({ name: 'Custom Project' });
      expect(project.name).toBe('Custom Project');
      expect(project.id).toBe('project-123');
    });

    test('createMockApiError creates structured error', () => {
      const error = createMockApiError(404, 'Not found', 'medium');
      expect(error.response.status).toBe(404);
      expect(error.processedError.message).toBe('Not found');
      expect(error.processedError.severity).toBe('medium');
    });
  });

  describe('Mock Providers', () => {
    test('TestAuthProvider wraps component with auth context', () => {
      const authValue = createAuthenticatedContext();

      render(
        <TestAuthProvider value={authValue}>
          <TestComponent />
        </TestAuthProvider>
      );

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    test('setupAuthenticatedScenario provides complete auth setup', () => {
      const scenario = setupAuthenticatedScenario({ username: 'testuser' });

      expect(scenario.user.username).toBe('testuser');
      expect(scenario.token).toBe('mock-jwt-token');
      expect(scenario.authContext.isAuthenticated).toBe(true);

      // Cleanup
      scenario.cleanup();
    });
  });

  describe('API Mocks', () => {
    test('authApiMocks provide consistent auth responses', () => {
      const loginResponse = authApiMocks.loginSuccess();
      expect(loginResponse.token).toBe('mock-jwt-token');
      expect(loginResponse.user.username).toBe('testuser');

      const errorResponse = authApiMocks.invalidCredentials();
      expect(errorResponse.response.status).toBe(401);
      expect(errorResponse.processedError.message).toBe('Invalid credentials.');
    });

    test('projectApiMocks provide consistent project responses', () => {
      const projectResponse = projectApiMocks.createSuccess();
      expect(projectResponse.project.name).toBe('New Project');
      expect(projectResponse.project.id).toBe('project-123');
    });
  });

  describe('Assertion Helpers', () => {
    test('expectLoadingState detects loading button', () => {
      const { container } = renderWithMinimalProviders(
        <TestComponent showLoading={true} />
      );

      expect(() => expectLoadingState(container, 'Loading...')).not.toThrow();
    });

    test('expectErrorMessage detects error text', () => {
      renderWithMinimalProviders(<TestComponent showError={true} />);

      expect(() => expectErrorMessage('An error occurred')).not.toThrow();
    });
  });

  describe('Form Helpers', () => {
    test('fillForm and submitForm work together', async () => {
      const { user } = renderWithMinimalProviders(<TestComponent />);

      await fillForm(user, {
        Email: 'test@example.com',
        Password: 'password123',
      });

      expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
      expect(screen.getByLabelText(/password/i)).toHaveValue('password123');

      await submitForm(user, 'Submit');
      // Form submission would be tested in actual component tests
    });
  });
});

// Helper function for the test (not exported)
function render(ui, options) {
  return renderWithMinimalProviders(ui, options);
}
