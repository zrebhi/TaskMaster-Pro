import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';
import AuthContext from '../../../context/AuthContext.jsx';
import { loginUser } from '../../../services/authApiService';

jest.mock('../../../services/authApiService');

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

const mockShowErrorToast = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('../../../context/ErrorContext', () => ({
  useError: () => ({
    showErrorToast: mockShowErrorToast,
    showSuccess: mockShowSuccess,
  }),
}));

describe('LoginForm', () => {
  let user;
  let identifierInput;
  let passwordInput;
  let submitButton;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    // Mock console.error to prevent test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    user = userEvent.setup();
  });

  // Test Case 1: Component Rendering
  test('renders the login form correctly', () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(identifierInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/login successful/i)).not.toBeInTheDocument();
  });

  // Test Case 2: Input Field Interaction
  test('updates state on input change', async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');

    await user.type(identifierInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(identifierInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  // Test Case 3: Form Submission - Successful Login (Username)
  test('calls API with username and navigates on successful login', async () => {
    const successResponse = {
      message: 'Login successful.',
      token: 'fake-token',
      user: { id: '123', username: 'testuser', email: 'test@example.com' },
    };
    loginUser.mockResolvedValue(successResponse);

    const mockLogin = jest.fn();
    render(
      <AuthContext.Provider
        value={{
          login: mockLogin,
          token: null,
          user: null,
          isAuthenticated: false,
          logout: jest.fn(),
        }}
      >
        <LoginForm />
      </AuthContext.Provider>
    );
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(identifierInput, 'testuser');
    await user.type(passwordInput, 'password123');

    await user.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledTimes(1);
      expect(loginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('fake-token', {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockShowSuccess).toHaveBeenCalledWith('Login successful!');
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test Case 4: Form Submission - Successful Login (Email)
  test('calls API with email and navigates on successful login', async () => {
    const successResponse = {
      message: 'Login successful.',
      token: 'fake-token-email',
      user: { id: '456', username: 'emailuser', email: 'email@example.com' },
    };
    loginUser.mockResolvedValue(successResponse);

    const mockLogin = jest.fn();
    render(
      <AuthContext.Provider
        value={{
          login: mockLogin,
          token: null,
          user: null,
          isAuthenticated: false,
          logout: jest.fn(),
        }}
      >
        <LoginForm />
      </AuthContext.Provider>
    );
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(identifierInput, 'email@example.com');
    await user.type(passwordInput, 'password456');

    await user.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledTimes(1);
      expect(loginUser).toHaveBeenCalledWith({
        email: 'email@example.com',
        password: 'password456',
      });
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('fake-token-email', {
        id: '456',
        username: 'emailuser',
        email: 'email@example.com',
      });
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockShowSuccess).toHaveBeenCalledWith('Login successful!');
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test Case 5: Form Submission - Failed Login (API Error)
  test('displays error message on failed login (API error)', async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    const errorWithProcessed = {
      processedError: {
        message: 'Invalid credentials.',
        severity: 'medium',
      },
    };
    loginUser.mockRejectedValue(errorWithProcessed);

    await user.type(identifierInput, 'wronguser');
    await user.type(passwordInput, 'wrongpassword');

    await user.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/invalid credentials./i)).toBeInTheDocument();
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        errorWithProcessed.processedError
      );
      expect(mockedNavigate).not.toHaveBeenCalled();
      expect(mockShowSuccess).not.toHaveBeenCalled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test Case 6: Form Submission - Network Error
  test('displays generic error message on network error', async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    const networkError = new Error('Network error, server down');
    loginUser.mockRejectedValue(networkError);

    await user.type(identifierInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Login failed. Please check your credentials.')
      ).toBeInTheDocument();
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: 'Login failed. Please check your credentials.',
        severity: 'medium',
      });
      expect(mockedNavigate).not.toHaveBeenCalled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test Case 7: Loading State
  test('disables submit button while loading', async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText('Email or Username:');
    passwordInput = screen.getByLabelText('Password:');
    submitButton = screen.getByRole('button', { name: 'Login' });

    loginUser.mockImplementation(() => new Promise(() => {}));

    await user.type(identifierInput, 'testuser');
    await user.type(passwordInput, 'password123');

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  afterEach(() => {
    // Restore console.error mock after each test
    jest.restoreAllMocks();
  });
});
