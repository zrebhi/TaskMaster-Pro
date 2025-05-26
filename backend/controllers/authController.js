const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input: username, email, and password are required
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username, email, and password." });
    }

    // Basic username validation (only letters, numbers, underscores, and hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, underscores, and hyphens.",
      });
    }

    // Basic password length validation (minimum 6 characters)
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }
    // TODO: Add more robust password validation (complexity, etc.)

    // Sequelize model handles username and email format validation

    // Hash the password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new user in the database
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
    });

    // Respond with success (do not send back the password_hash)
    // TODO: Implement immediate login and return a JWT upon successful registration
    res.status(201).json({
      message: "User registered successfully.",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "SequelizeValidationError") {
      const friendlyMessages = error.errors.map((e) => {
        switch (e.validatorKey) {
          case "isEmail":
            return "Please provide a valid email address.";
          case "len":
            return `Invalid length for ${e.path}`;
          case "notEmpty":
            return `${e.path} cannot be empty`;
          default:
            return e.message;
        }
      });
      return res.status(400).json({ message: friendlyMessages.join(" ") });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      const messages = error.errors.map(
        (e) => `${e.path} '${e.value}' already exists`
      );
      return res.status(409).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input: require password and either email or username
    if ((!email && !username) || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email or username, and password." });
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
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const payload = {
      userId: user.id, // Include user ID in the token payload
      username: user.username, // Optionally include username or other non-sensitive info
    };

    // Sign the token using JWT secret and expiration from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("🔥 JWT_SECRET environment variable not set!");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
    if (!jwtExpiresIn) {
      console.error("🔥 JWT_EXPIRES_IN environment variable not set!");
      return res.status(500).json({ message: "Server configuration error." });
    }
    const jwtOptions = {
      expiresIn: jwtExpiresIn,
      algorithm: "HS256",
    };
    const token = jwt.sign(payload, jwtSecret, jwtOptions);

    // Respond with the token and expiration time
    const decodedToken = jwt.decode(token); // Decode the token to get payload
    const expiresAt = decodedToken.exp; // Get expiration timestamp

    res.status(200).json({
      message: "Login successful.",
      token: token,
      expiresAt: expiresAt, // Include expiration timestamp
      user: {
        // Optionally send back some user info (excluding password_hash)
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};
