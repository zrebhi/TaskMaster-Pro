const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    // Basic password length validation (e.g., minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    // TO-DO: Add more robust password validation (complexity, etc.)

    // We do not need to validate username and email format here, 
    // as Sequelize handles it with the User model.

    // 2. Hash the password
    const saltRounds = 10; // Or from environment variable
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create the new user in the database
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
    });

    // 5. Respond with success (don't send back the password_hash)
    // For MVP, a simple success message is fine.
    // Optionally, log the user in immediately and return a JWT (see F-AUTH-02)
    res.status(201).json({
      message: 'User registered successfully.',
      userId: newUser.id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeValidationError') {
      const friendlyMessages = error.errors.map(e => {
        switch(e.validatorKey) {
          case 'isEmail':
            return 'Please provide a valid email address.';
          case 'len':
            return `Invalid length for ${e.path}`;
          case 'notEmpty':
            return `${e.path} cannot be empty`;
          default:
            return e.message;
        }
      });
      return res.status(400).json({ message: friendlyMessages.join(' ') });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map(e => `${e.path} '${e.value}' already exists`);
      return res.status(409).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration.' });
  }
};