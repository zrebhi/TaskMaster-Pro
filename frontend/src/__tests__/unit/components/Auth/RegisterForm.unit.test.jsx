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

  test('renders form elements correctly', () => {
    renderRegisterForm();

    expect(
      screen.getByRole('heading', { name: 'Register' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Username:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Register' })
    ).toBeInTheDocument();
  });

  test('updates input values on user interaction', async () => {
    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'testuser');
    await user.type(screen.getByLabelText('Email:'), 'test@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password:'), 'password123');

    expect(screen.getByLabelText('Username:')).toHaveValue('testuser');
    expect(screen.getByLabelText('Email:')).toHaveValue('test@example.com');
    expect(screen.getByLabelText('Password:')).toHaveValue('password123');
    expect(screen.getByLabelText('Confirm Password:')).toHaveValue(
      'password123'
    );
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

  test('handles network error', async () => {
    const { error } = setupFailedAuthFlow('network');

    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'testuser');
    await user.type(screen.getByLabelText('Email:'), 'test@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password:'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(error.processedError);
    });
  });

  test('disables submit button during loading', async () => {
    const { mocks } = setupSuccessfulAuthFlow();
    mocks.registerUser.mockImplementation(() => new Promise(() => {}));

    renderRegisterForm();

    await user.type(screen.getByLabelText('Username:'), 'testuser');
    await user.type(screen.getByLabelText('Email:'), 'test@example.com');
    await user.type(screen.getByLabelText('Password:'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password:'), 'password123');

    const submitButton = screen.getByRole('button', { name: 'Register' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test('validates required fields', async () => {
    const { mocks } = setupSuccessfulAuthFlow();

    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: 'Register' });
    await user.click(submitButton);

    expect(mocks.registerUser).not.toHaveBeenCalled();
  });
});
