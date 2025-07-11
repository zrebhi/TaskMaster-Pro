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
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Factory function to create appropriate error based on Sequelize errors
 * @param {Error} sequelizeError - The Sequelize error
 * @returns {AppError} Appropriate custom error
 */
const createSequelizeError = (sequelizeError) => {
  switch (sequelizeError.name) {
    case 'SequelizeValidationError':
      if (sequelizeError.errors && Array.isArray(sequelizeError.errors)) {
        const validationMessages = sequelizeError.errors.map((e) => e.message);
        return new ValidationError(
          validationMessages.join(' '),
          sequelizeError.errors
        );
      }
      return new ValidationError('Validation failed', sequelizeError);

    case 'SequelizeUniqueConstraintError':
      if (sequelizeError.errors && Array.isArray(sequelizeError.errors)) {
        const conflictMessages = sequelizeError.errors.map(
          (e) => `${e.path} '${e.value}' already exists`
        );
        return new ConflictError(conflictMessages.join(' '));
      }
      return new ConflictError('Unique constraint violation');

    case 'SequelizeForeignKeyConstraintError':
      return new ValidationError('Invalid reference to related resource');

    case 'SequelizeConnectionError':
    case 'SequelizeDatabaseError':
      // Check if it's an invalid UUID error and return 400 instead of 500
      if (
        sequelizeError.message &&
        sequelizeError.message.includes('invalid input syntax for type uuid')
      ) {
        return new ValidationError('Invalid ID format provided');
      }
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
