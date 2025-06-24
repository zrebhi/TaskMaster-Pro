import { createContext, useState, useEffect } from 'react';
import { setAuthContext, resetLogoutFlag } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user data from sessionStorage:', error);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token); // True if token exists

  useEffect(() => {
    // This effect runs once on mount to initialize state from sessionStorage
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
        setToken(storedToken);
        setUser(null);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Set auth context reference for apiClient whenever auth state changes
  useEffect(() => {
    const authContextValue = {
      token,
      user,
      isAuthenticated,
      login,
      logout,
    };
    setAuthContext(authContextValue);
  }, [token, user, isAuthenticated]);

  const login = (newToken, userData) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    resetLogoutFlag();
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // TODO: Potentially call backend /api/auth/logout when implemented
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
