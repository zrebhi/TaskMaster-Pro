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

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email or Username:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('updates input values on user interaction', async () => {
    renderLoginForm();

    const identifierInput = screen.getByLabelText('Email or Username:');
    const passwordInput = screen.getByLabelText('Password:');

    await user.type(identifierInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(identifierInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
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

  test('handles network error', async () => {
    const { error } = setupFailedAuthFlow('network');

    renderLoginForm();

    await fillForm(user, {
      'Email or Username': 'testuser',
      Password: 'password123',
    });
    await submitForm(user, 'Login');

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(error.processedError);
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
});
