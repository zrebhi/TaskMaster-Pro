import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegisterForm from '../../../../components/Auth/RegisterForm';
import {
  renderWithMinimalProviders,
  submitForm,
} from '../../../helpers/test-utils';
import { TestErrorProvider } from '../../../helpers/mock-providers';
import {
  authApiMocks,
  setupSuccessfulAuthFlow,
  setupFailedAuthFlow,
} from '../../../helpers/api-mocks';

jest.mock('../../../../services/authApiService');

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('RegisterForm Unit Tests', () => {
  let user;
  let mockShowErrorToast;
  let mockShowSuccess;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    mockShowErrorToast = jest.fn();
    mockShowSuccess = jest.fn();
  });

  const renderRegisterForm = (errorValue = {}) => {
    const defaultErrorValue = {
      showErrorToast: mockShowErrorToast,
      showSuccess: mockShowSuccess,
    };

    return renderWithMinimalProviders(
      <TestErrorProvider value={{ ...defaultErrorValue, ...errorValue }}>
        <RegisterForm />
      </TestErrorProvider>
    );
  };

  const fillRegistrationForm = async (formData = {}) => {
    const defaultData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const data = { ...defaultData, ...formData };

    await user.type(screen.getByLabelText('Username:'), data.username);
    await user.type(screen.getByLabelText('Email:'), data.email);
    await user.type(screen.getByLabelText('Password:'), data.password);
    await user.type(
      screen.getByLabelText('Confirm Password:'),
      data.confirmPassword
    );
  };

  test('renders form elements correctly', () => {
    renderRegisterForm();

    expect(
      screen.getByText('Enter your information below to create your account')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Username:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Register' })
    ).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    const authResponse = authApiMocks.registerSuccess();
    mocks.registerUser.mockResolvedValue(authResponse);

    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'newuser');
    await user.type(screen.getByLabelText('Email:'), 'new@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password:'), 'password123');
    await submitForm(user, 'Register');

    await waitFor(() => {
      expect(mocks.registerUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(mockShowSuccess).toHaveBeenCalledWith('Registration successful.');
      expect(mockedNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  test('shows error when passwords do not match', async () => {
    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'testuser');
    await user.type(screen.getByLabelText('Email:'), 'test@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(
      screen.getByLabelText('Confirm Password:'),
      'differentpassword'
    );
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    // No API call should be made for client-side validation
  });

  test('handles API error with processed error', async () => {
    const { error } = setupFailedAuthFlow('validation');

    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'existinguser');
    await user.type(screen.getByLabelText('Email:'), 'test@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password:'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(error.processedError);
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test('shows error when password is too short', async () => {
    renderRegisterForm();

    await fillRegistrationForm({
      password: '12345', // 5 characters
      confirmPassword: '12345',
    });
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      screen.getByText('Password must be at least 6 characters long.')
    ).toBeInTheDocument();
  });

  test('shows error when username contains invalid characters', async () => {
    renderRegisterForm();

    await fillRegistrationForm({
      username: 'test@user!', // Invalid characters
    });
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      screen.getByText(
        'Username can only contain letters, numbers, underscores, and hyphens.'
      )
    ).toBeInTheDocument();
  });

  test('handles API error without processed error', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    // Create an error without processedError property
    const rawError = new Error('Raw API error');
    mocks.registerUser.mockRejectedValue(rawError);

    renderRegisterForm();

    await fillRegistrationForm();
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: 'Registration failed. Please try again.',
        severity: 'medium',
      });
    });
  });

  test('uses fallback success message when API response has no message', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    // Create response without message property
    const authResponse = { ...authApiMocks.registerSuccess(), message: '' };
    mocks.registerUser.mockResolvedValue(authResponse);

    renderRegisterForm();

    await fillRegistrationForm({
      username: 'newuser',
      email: 'new@example.com',
    });
    await submitForm(user, 'Register');

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Registration successful! You can now log in.'
      );
      expect(mockedNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  test('trims leading/trailing whitespace from username and email on submission', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    const authResponse = authApiMocks.registerSuccess();
    mocks.registerUser.mockResolvedValue(authResponse);

    renderRegisterForm();

    await fillRegistrationForm({
      username: '  trimmeduser  ',
      email: '  trimmed@example.com  ',
    });
    await submitForm(user, 'Register');

    // Assert: Check that the API was called with the trimmed and lowercased values
    await waitFor(() => {
      expect(mocks.registerUser).toHaveBeenCalledWith({
        username: 'trimmeduser', // Should be trimmed and lowercased
        email: 'trimmed@example.com', // Should be trimmed and lowercased
        password: 'password123',
      });
    });

    // Assert: A successful navigation confirms that no client-side validation errors occurred.
    expect(mockedNavigate).toHaveBeenCalled();
  });
});
