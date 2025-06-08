const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  AppError,
} = require('../utils/customErrors');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.registerUser = asyncHandler(async (req, res) => {
  let { username = '', email = '', password = '' } = req.body;
  username = username.trim();
  email = email.trim().toLowerCase();
  password = password.trim();

  // Validate input: username, email, and password are required
  if (!username || !email || !password) {
    throw new ValidationError('Please provide username, email, and password.');
  }

  // Basic username validation (only letters, numbers, underscores, and hyphens)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    throw new ValidationError(
      'Username can only contain letters, numbers, underscores, and hyphens.'
    );
  }

  // Basic password length validation (minimum 6 characters)
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long.');
  }

  // Hash the password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create the new user in the database
  const newUser = await User.create({
    username,
    email,
    password_hash: hashedPassword,
  });

  // Respond with success (do not send back the password_hash)
  return res.status(201).json({
    message: 'User registered successfully.',
    userId: newUser.id,
  });
});

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Validate input: require password and either email or username
  if ((!email && !username) || !password) {
    throw new ValidationError(
      'Please provide email or username, and password.'
    );
  }

  // Find the user by email or username
  const whereClause = {};
  if (email) {
    whereClause.email = email;
  } else if (username) {
    whereClause.username = username;
  }

  const user = await User.findOne({
    where: whereClause,
  });

  if (!user) {
    throw new AuthenticationError('Invalid credentials.');
  }

  // Compare the provided password with the stored hashed password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AuthenticationError('Invalid credentials.');
  }

  // Generate JWT
  const payload = {
    userId: user.id,
    username: user.username,
  };

  // Sign the token using JWT secret and expiration from environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('Server configuration error.', 500, 'CONFIG_ERROR');
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  if (!jwtExpiresIn) {
    throw new AppError('Server configuration error.', 500, 'CONFIG_ERROR');
  }

  const jwtOptions = {
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256',
  };
  const token = jwt.sign(payload, jwtSecret, jwtOptions);

  // Respond with the token and expiration time
  const decodedToken = jwt.decode(token);
  const expiresAt = decodedToken.exp;

  return res.status(200).json({
    message: 'Login successful.',
    token: token,
    expiresAt: expiresAt,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});
