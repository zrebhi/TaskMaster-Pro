import React, { createContext, useState, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ERROR_SEVERITY } from '../utils/errorHandler';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [globalErrors, setGlobalErrors] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Add a global error to the error list
   * @param {Object} errorInfo - Error information object
   */
  const addError = useCallback((errorInfo) => {
    const error = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...errorInfo
    };

    setGlobalErrors(prev => [...prev, error]);

    // Auto-remove error after timeout based on severity
    const timeout = getTimeoutBySeverity(error.severity);
    setTimeout(() => {
      removeError(error.id);
    }, timeout);

    return error.id;
  }, []);

  /**
   * Remove an error from the global error list
   * @param {string} errorId - Error ID to remove
   */
  const removeError = useCallback((errorId) => {
    setGlobalErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  /**
   * Show error notification with appropriate styling
   * @param {Object} errorResult - Error result from handleApiError
   * @param {Object} options - Toast options
   */
  const showErrorToast = useCallback((errorResult, options = {}) => {
    const toastOptions = {
      duration: getTimeoutBySeverity(errorResult.severity),
      style: getToastStyleBySeverity(errorResult.severity),
      ...options
    };

    if (errorResult.isNetworkError && !isOnline) {
      toast.error('You appear to be offline. Please check your internet connection.', toastOptions);
    } else {
      toast.error(errorResult.message, toastOptions);
    }
  }, [isOnline]);

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {Object} options - Toast options
   */
  const showSuccess = useCallback((message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: '#10b981',
        color: 'white',
      },
      ...options
    });
  }, []);

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {Object} options - Toast options
   */
  const showInfo = useCallback((message, options = {}) => {
    toast(message, {
      duration: 4000,
      style: {
        background: '#3b82f6',
        color: 'white',
      },
      ...options
    });
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        globalErrors,
        isOnline,
        addError,
        removeError,
        clearAllErrors,
        showErrorToast,
        showSuccess,
        showInfo,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Get timeout duration based on error severity
 * @param {string} severity - Error severity level
 * @returns {number} Timeout in milliseconds
 */
const getTimeoutBySeverity = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.LOW:
      return 3000;
    case ERROR_SEVERITY.MEDIUM:
      return 5000;
    case ERROR_SEVERITY.HIGH:
      return 8000;
    case ERROR_SEVERITY.CRITICAL:
      return 10000;
    default:
      return 5000;
  }
};

/**
 * Get toast styling based on error severity
 * @param {string} severity - Error severity level
 * @returns {Object} Toast style object
 */
const getToastStyleBySeverity = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.LOW:
      return {
        background: '#fbbf24',
        color: 'white',
      };
    case ERROR_SEVERITY.MEDIUM:
      return {
        background: '#f59e0b',
        color: 'white',
      };
    case ERROR_SEVERITY.HIGH:
      return {
        background: '#ef4444',
        color: 'white',
      };
    case ERROR_SEVERITY.CRITICAL:
      return {
        background: '#dc2626',
        color: 'white',
        fontWeight: 'bold',
      };
    default:
      return {
        background: '#ef4444',
        color: 'white',
      };
  }
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
