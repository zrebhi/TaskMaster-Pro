const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Get token from header (Bearer <token>)
      token = authHeader.split(' ')[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET environment variable is not set');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      const decoded = jwt.verify(token, jwtSecret);

      // Add decoded user payload to request object
      // The payload contains userId
      // This makes user information available in subsequent route handlers
      req.user = decoded;
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ message: 'Not authorized, token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
