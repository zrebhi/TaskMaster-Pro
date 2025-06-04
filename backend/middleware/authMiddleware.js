const jwt = require('jsonwebtoken');
const { AuthenticationError, AppError } = require('../utils/customErrors');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Not authorized, no token');
    }

    // Get token from header (Bearer <token>)
    const token = authHeader.split(' ')[1];

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('Server configuration error', 500, 'CONFIG_ERROR');
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Add decoded user payload to request object
    req.user = decoded;
    next();
  } catch (error) {
    // JWT errors will be handled by the global error handler
    // which already has specific handling for JWT errors
    next(error);
  }
};

module.exports = { protect };
