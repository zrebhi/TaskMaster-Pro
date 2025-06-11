import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginForm from '../../../../components/Auth/LoginForm';
import {
  renderWithMinimalProviders,
  fillForm,
  submitForm,
} from '../../../helpers/test-utils';
import {
  TestAuthProvider,
  TestErrorProvider,
} from '../../../helpers/mock-providers';
import {
  authApiMocks,
  setupSuccessfulAuthFlow,
  setupFailedAuthFlow,
  setupLoadingSimulation,
} from '../../../helpers/api-mocks';

jest.mock('../../../../services/authApiService');

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('LoginForm Unit Tests', () => {
  let user;
  let mockLogin;
  let mockShowErrorToast;
  let mockShowSuccess;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    mockLogin = jest.fn();
    mockShowErrorToast = jest.fn();
    mockShowSuccess = jest.fn();
  });

  const renderLoginForm = (authValue = {}, errorValue = {}) => {
    const defaultAuthValue = { login: mockLogin };
    const defaultErrorValue = {
      showErrorToast: mockShowErrorToast,
      showSuccess: mockShowSuccess,
    };

    return renderWithMinimalProviders(
      <TestErrorProvider value={{ ...defaultErrorValue, ...errorValue }}>
        <TestAuthProvider value={{ ...defaultAuthValue, ...authValue }}>
          <LoginForm />
        </TestAuthProvider>
      </TestErrorProvider>
    );
  };

  test('renders form elements correctly', () => {
    renderLoginForm();

    expect(screen.getByText('Login to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email or Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('handles successful login with username', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    const authResponse = authApiMocks.loginSuccess();

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'testuser',
      Password: 'password123',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mocks.loginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith(
        authResponse.token,
        authResponse.user
      );
      expect(mockShowSuccess).toHaveBeenCalledWith('Login successful!');
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles successful login with email', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    const authResponse = authApiMocks.loginWithEmail();

    // Override the mock to return the specific email response
    mocks.loginUser.mockResolvedValue(authResponse);

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'test@example.com',
      Password: 'password123',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mocks.loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith(
        authResponse.token,
        authResponse.user
      );
    });
  });

  test('handles API error with processed error', async () => {
    const { error } = setupFailedAuthFlow('credentials');

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'wronguser',
      Password: 'wrongpass',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(error.processedError);
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test('disables submit button during loading', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    setupLoadingSimulation(mocks);

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'testuser',
      Password: 'password123',
    });

    const submitButton = screen.getByRole('button', { name: 'Login' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test('handles API error without processed error', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    // Create an error without processedError property
    const rawError = new Error('Raw API error');
    mocks.loginUser.mockRejectedValue(rawError);

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'testuser',
      Password: 'password123',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: 'Login failed. Please check your credentials.',
        severity: 'medium',
      });
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles successful login when auth context has no login function', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    const authResponse = authApiMocks.loginSuccess();
    mocks.loginUser.mockResolvedValue(authResponse);

    // Render with auth context that has no login function
    renderLoginForm({ login: null });

    await fillForm(user, {
      'Email or Username': 'testuser',
      Password: 'password123',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mocks.loginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockShowSuccess).toHaveBeenCalledWith('Login successful!');
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
      // Auth login should not be called since it's null
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
