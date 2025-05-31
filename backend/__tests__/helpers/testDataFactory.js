const { User } = require('../../models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createUser(options = {}) {
  const defaultOptions = {
    username: `testuser_${uuidv4().slice(0, 8)}`,
    email: `test_${uuidv4().slice(0, 8)}@example.com`,
    password: 'testpassword123',
  };

  const userData = { ...defaultOptions, ...options };

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await User.create({
    id: uuidv4(),
    username: userData.username,
    email: userData.email,
    password_hash: hashedPassword,
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user,
    token,
    plainPassword: userData.password,
  };
}

module.exports = { createUser };
