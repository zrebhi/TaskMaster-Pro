const { AppError, createSequelizeError } = require('../utils/customErrors');

/**
 * Development error response - includes stack trace and detailed info
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: 'error',
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: err.timestamp || new Date().toISOString(),
    errorCode: err.errorCode,
  });
};

/**
 * Production error response - user-friendly messages only
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errorCode: err.errorCode,
      timestamp: err.timestamp || new Date().toISOString(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong on our end. Please try again later.',
      errorCode: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {AppError} Formatted authentication error
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError(
      'Invalid token. Please log in again.',
      401,
      'INVALID_TOKEN'
    );
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError(
      'Your session has expired. Please log in again.',
      401,
      'TOKEN_EXPIRED'
    );
  }
  return new AppError(
    'Authentication failed. Please log in again.',
    401,
    'AUTH_FAILED'
  );
};

/**
 * Handle validation errors from express-validator
 * @param {Array} errors - Validation errors array
 * @returns {AppError} Formatted validation error
 */
const handleValidationErrors = (errors) => {
  const messages = errors.map((error) => error.msg);
  return new AppError(messages.join(' '), 400, 'VALIDATION_ERROR');
};

/**
 * Log error for monitoring and debugging
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
    },
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    console.error('🚨 SERVER ERROR:', errorLog);
  } else if (err.statusCode >= 400) {
    console.warn('⚠️ CLIENT ERROR:', errorLog);
  } else {
    console.info('ℹ️ INFO:', errorLog);
  }

  // TODO: Send to external logging service (Winston, Sentry, etc.)
  // Example: logger.error(errorLog);
};

/**
 * Global error handling middleware
 * This should be the last middleware in the application
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types using mapping
  const errorHandlers = {
    // Sequelize errors
    SequelizeValidationError: createSequelizeError,
    SequelizeUniqueConstraintError: createSequelizeError,
    SequelizeForeignKeyConstraintError: createSequelizeError,
    SequelizeConnectionError: createSequelizeError,
    SequelizeDatabaseError: createSequelizeError,

    // JWT errors
    JsonWebTokenError: handleJWTError,
    TokenExpiredError: handleJWTError,
    NotBeforeError: handleJWTError,
  };

  const handler = errorHandlers[err.name];
  if (handler) {
    error = handler(err);
  }

  // Handle express-validator errors
  if (err.name === 'ValidationError' && err.errors) {
    error = handleValidationErrors(err.errors);
  }

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(err);
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  logError,
};
