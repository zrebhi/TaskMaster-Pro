/**
 * Custom error classes for consistent error handling
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Factory function to create appropriate error based on Sequelize errors
 * @param {Error} sequelizeError - The Sequelize error
 * @returns {AppError} Appropriate custom error
 */
const createSequelizeError = (sequelizeError) => {
  const validationMessages = sequelizeError.errors.map((e) => e.message);
  const conflictMessages = sequelizeError.errors.map(
    (e) => `${e.path} '${e.value}' already exists`
  );

  switch (sequelizeError.name) {
    case 'SequelizeValidationError':
      return new ValidationError(
        validationMessages.join(' '),
        sequelizeError.errors
      );

    case 'SequelizeUniqueConstraintError':

      return new ConflictError(conflictMessages.join(' '));

    case 'SequelizeForeignKeyConstraintError':
      return new ValidationError('Invalid reference to related resource');

    case 'SequelizeConnectionError':
    case 'SequelizeDatabaseError':
      return new DatabaseError('Database operation failed', sequelizeError);

    default:
      return new DatabaseError('Database operation failed', sequelizeError);
  }
};

/**
 * Async error wrapper for route handlers
 * Automatically catches and forwards errors to error handling middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  createSequelizeError,
  asyncHandler,
};
