import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import AuthContext from '../../../context/AuthContext';

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
};

// Helper component to provide AuthContext
const MockAuthProvider = ({ children, authValue }) => (
  <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
);

describe('Navbar', () => {
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  test('renders the Logout button when the user is authenticated', () => {
    render(
      // MemoryRouter provides the necessary router context for testing components
      // using react-router-dom features like Link and useNavigate in a non-browser environment.
      <MemoryRouter>
        <MockAuthProvider
          authValue={{
            ...mockAuthContext,
            isAuthenticated: true,
            user: { username: 'testuser' },
          }}
        >
          <Navbar />
        </MockAuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
  });

  test('does not render the Logout button when the user is not authenticated', () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          authValue={{ ...mockAuthContext, isAuthenticated: false }}
        >
          <Navbar />
        </MockAuthProvider>
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole('button', { name: /logout/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/login | register/i)).toBeInTheDocument();
  });

  test('clicking Logout button calls context logout and navigates to /auth', async () => {
    render(
      <MemoryRouter>
        <MockAuthProvider
          authValue={{
            ...mockAuthContext,
            isAuthenticated: true,
          }}
        >
          <Navbar />
        </MockAuthProvider>
      </MemoryRouter>,
    );
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
    expect(mockedNavigate).toHaveBeenCalledTimes(1);
    expect(mockedNavigate).toHaveBeenCalledWith('/auth');
  });
});
