/**
 * Centralized error handling utility for API errors
 * Provides user-friendly error messages and categorizes error types
 */

/**
 * Determines if an error is a network connectivity issue
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    !error.response &&
    (error.code === 'ECONNREFUSED' ||
      error.code === 'NETWORK_ERR' ||
      error.message === 'Network Error' ||
      error.message.includes('fetch'))
  );
};

/**
 * Determines if an error is an authentication error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's an auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.status === 401;
};

/**
 * Determines if an error is a server error (5xx)
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a server error
 */
export const isServerError = (error) => {
  const status = error.response?.status || error.status;
  return status >= 500 && status < 600;
};

/**
 * Determines if an error is a client error (4xx, excluding 401)
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a client error
 */
export const isClientError = (error) => {
  const status = error.response?.status || error.status;
  return status >= 400 && status < 500 && status !== 401;
};

/**
 * Generates a user-friendly error message based on error type and context
 * @param {Error} error - The error object
 * @param {string} context - Context of the operation (e.g., 'fetching tasks', 'creating project')
 * @returns {string} User-friendly error message
 */
 export const getErrorMessage = (error, context = 'performing this action') => {
   // 1. Handle errors that MUST have a generic frontend message.
   if (isNetworkError(error)) {
     return `Unable to connect to the server. Please check your internet connection and try again.`;
    }
    if (isServerError(error)) {
      return `The server is currently experiencing issues. Please try again in a few moments.`;
    }
    
    // 2. For all other errors (Client, Auth), prioritize the specific message from the API.
    const apiMessage = error.response?.data?.message;
    if (apiMessage) {
      return apiMessage;
    }
    
  // 3. Provide generic fallbacks only if the API fails to provide a specific message.
  // This is now the fallback for a 401 with no message, as required by the test.
  if (isAuthError(error)) {
    return 'Authentication failed. Please log in to continue.';
  }
  if (isClientError(error)) {
    // This is the fallback for a 4xx with no message, as required by the test.
    return `There was an issue with your request while ${context}. Please check your input and try again.`;
  }
 
  // 4. Final, most generic fallback.
  return `An unexpected error occurred while ${context}. Please try again.`;
};

/**
 * Error severity levels for logging and monitoring
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Gets error severity based on error type
 * @param {Error} error - The error object
 * @returns {string} Error severity level
 */
export const getErrorSeverity = (error) => {
  if (isNetworkError(error)) return ERROR_SEVERITY.HIGH;
  if (isAuthError(error)) return ERROR_SEVERITY.MEDIUM;
  if (isServerError(error)) return ERROR_SEVERITY.HIGH;
  if (isClientError(error)) return ERROR_SEVERITY.LOW;
  return ERROR_SEVERITY.MEDIUM;
};

/**
 * Logs error for monitoring (can be extended with external services)
 * @param {Error} error - The error object
 * @param {string} context - Context of the operation
 * @param {string} severity - Error severity level
 */
export const logError = (error, context, severity) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    severity,
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    response: error.response?.data,
    status: error.response?.status || error.status,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${severity.toUpperCase()}] Error ${context}:`, errorLog);
  }

  // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { extra: errorLog });
};

/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object
 * @param {string} context - Context of the operation
 * @param {Function} logout - Logout function for auth errors
 * @returns {Object} Error handling result with message and shouldLogout flag
 */
export const handleApiError = (error, context, logout = null) => {
  const userMessage = getErrorMessage(error, context);
  const shouldLogout = isAuthError(error);
  const severity = getErrorSeverity(error);

  // Log error for monitoring
  logError(error, context, severity);

  if (shouldLogout && logout) {
    logout();
  }

  return {
    message: userMessage,
    shouldLogout,
    severity,
    isNetworkError: isNetworkError(error),
    isServerError: isServerError(error),
    isClientError: isClientError(error),
    timestamp: new Date().toISOString(),
  };
};
