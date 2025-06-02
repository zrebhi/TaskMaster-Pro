import { renderHook, act, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import AuthContext, { AuthProvider } from '../../../context/AuthContext';
import { setupSessionStorageMock } from '../../helpers/mock-providers';
import { setAuthContext } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  setAuthContext: jest.fn(),
}));

describe('AuthContext', () => {
  let sessionStorageRestore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (sessionStorageRestore) {
      sessionStorageRestore();
      sessionStorageRestore = null;
    }
  });

  describe('Provider State Management', () => {
    test('initializes with empty state when no sessionStorage data', () => {
      const { restore } = setupSessionStorageMock({});
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });

    test('initializes with stored token and user from sessionStorage', () => {
      const token = 'stored-token';
      const user = { id: '1', username: 'testuser' };
      const { restore } = setupSessionStorageMock({ token, user });
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('handles malformed user data in sessionStorage gracefully', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const token = 'valid-token';
      const { sessionStorageMock, restore } = setupSessionStorageMock({
        token,
      });
      sessionStorageRestore = restore;

      sessionStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return token;
        if (key === 'user') return 'invalid-json';
        return null;
      });

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login Functionality', () => {
    test('login updates state and sessionStorage', () => {
      const { sessionStorageMock, restore } = setupSessionStorageMock({});
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      const token = 'new-token';
      const user = { id: '2', username: 'newuser' };

      act(() => {
        result.current.login(token, user);
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('token', token);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(user)
      );
    });

    test('multiple login calls update state correctly', () => {
      const { restore } = setupSessionStorageMock({});
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      const firstToken = 'first-token';
      const firstUser = { id: '1', username: 'first' };
      const secondToken = 'second-token';
      const secondUser = { id: '2', username: 'second' };

      act(() => {
        result.current.login(firstToken, firstUser);
      });

      expect(result.current.token).toBe(firstToken);
      expect(result.current.user).toEqual(firstUser);

      act(() => {
        result.current.login(secondToken, secondUser);
      });

      expect(result.current.token).toBe(secondToken);
      expect(result.current.user).toEqual(secondUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Logout Functionality', () => {
    test('logout clears state and sessionStorage', () => {
      const token = 'logout-token';
      const user = { id: '3', username: 'logoutuser' };
      const { sessionStorageMock, restore } = setupSessionStorageMock({
        token,
        user,
      });
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    test('logout from unauthenticated state works correctly', () => {
      const { sessionStorageMock, restore } = setupSessionStorageMock({});
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('ApiClient Integration', () => {
    test('calls setAuthContext on mount with initial state', async () => {
      const token = 'api-token';
      const user = { id: '4', username: 'apiuser' };
      const { restore } = setupSessionStorageMock({ token, user });
      sessionStorageRestore = restore;

      renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(setAuthContext).toHaveBeenCalledWith(
          expect.objectContaining({
            token,
            user,
            isAuthenticated: true,
            login: expect.any(Function),
            logout: expect.any(Function),
          })
        );
      });
    });

    test('calls setAuthContext when login is called', async () => {
      const { restore } = setupSessionStorageMock({});
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      const token = 'login-api-token';
      const user = { id: '5', username: 'loginapi' };

      act(() => {
        result.current.login(token, user);
      });

      await waitFor(() => {
        expect(setAuthContext).toHaveBeenCalledWith(
          expect.objectContaining({
            token,
            user,
            isAuthenticated: true,
            login: expect.any(Function),
            logout: expect.any(Function),
          })
        );
      });
    });

    test('calls setAuthContext when logout is called', async () => {
      const token = 'logout-api-token';
      const user = { id: '6', username: 'logoutapi' };
      const { restore } = setupSessionStorageMock({ token, user });
      sessionStorageRestore = restore;

      const { result } = renderHook(() => useContext(AuthContext), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(setAuthContext).toHaveBeenCalledWith(
          expect.objectContaining({
            token: null,
            user: null,
            isAuthenticated: false,
            login: expect.any(Function),
            logout: expect.any(Function),
          })
        );
      });
    });
  });
});
