const request = require('supertest');
const app = require('../../../server');
const { User } = require('../../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const databaseTestHelper = require('../../helpers/database');
const { createUser } = require('../../helpers/testDataFactory');

describe('Authentication Routes - /api/auth', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for this test suite
    const userData = await createUser({
      username: 'globaltestuser',
      email: 'globaltestuser@example.com',
    });

    testUser = userData.user;
  });

  afterEach(async () => {
    // Clean up test data manually
    await databaseTestHelper.truncateAllTables();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully with valid data', async () => {
      const userData = {
        username: 'testuser_register',
        email: 'register@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'User registered successfully.'
      );
      expect(response.body).toHaveProperty('userId');
      const userId = response.body.userId;

      // Verify user was created in the database
      const dbUser = await User.findByPk(userId);
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe(userData.username);
      expect(dbUser.email).toBe(userData.email);
      // Verify password was hashed
      expect(dbUser.password_hash).not.toBe(userData.password);
      const isPasswordCorrect = await bcrypt.compare(
        userData.password,
        dbUser.password_hash
      );
      expect(isPasswordCorrect).toBe(true);
    });

    test('should return 400 if required fields are missing (e.g., email)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser_missing_fields',
        password: 'password123',
        // email missing
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Please provide username, email, and password.'
      );
    });

    test('should return 400 when request body is empty', async () => {
      const response = await request(app).post('/api/auth/register').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Request body is required. Please provide the necessary data.'
      );
    });

    test('should return 400 when no request body is provided', async () => {
      const response = await request(app).post('/api/auth/register');
      // No .send() call - no body

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Request body is required. Please provide the necessary data.'
      );
    });

    test('should return 400 for invalid username format (e.g. contains @)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'test@user', // Invalid char
        email: 'invaliduser@example.com',
        password: 'password123',
      });

      expect(response.statusCode).toBe(400);
      // The exact message might depend on your validation logic in the controller
      expect(response.body).toHaveProperty('message');
      // Example: "Username can only contain letters, numbers, underscores, and hyphens."
    });

    test('should return 409 if email already exists', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: testUser.email, // Same email as test user
        password: 'password456',
      });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toContain(
        `email '${testUser.email}' already exists`
      );
      consoleErrorSpy.mockRestore(); // Restore original console.error
    });

    test('should return 409 if username already exists', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await request(app).post('/api/auth/register').send({
        username: testUser.username, // Same username as test user
        email: 'another_unique_email@example.com',
        password: 'password456',
      });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toContain(
        `username '${testUser.username}' already exists`
      );
      consoleErrorSpy.mockRestore(); // Restore original console.error
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login a user successfully with valid email and password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'testpassword123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful.');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('email', testUser.email);

      // Verify the token contains the correct user information
      const decodedToken = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET
      );
      expect(decodedToken.userId).toBe(testUser.id);
      expect(decodedToken.username).toBe(testUser.username);
    });

    test('should login a user successfully with valid username and password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: testUser.username,
        password: 'testpassword123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful.');
      expect(response.body).toHaveProperty('token');
      // Add other assertions as needed, e.g., for expiresAt
    });

    test('should return 401 if user is not found (wrong email)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'testpassword123',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    test('should return 401 if user is not found (wrong username)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent_username',
        password: 'testpassword123',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    test('should return 401 if password is incorrect', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    test('should return 400 if required fields are missing (e.g. password)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        // password missing
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Please provide email or username, and password.'
      );
    });

    test('should return 400 when request body is empty', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Request body is required. Please provide the necessary data.'
      );
    });

    test('should return 400 when no request body is provided', async () => {
      const response = await request(app).post('/api/auth/login');
      // No .send() call - no body

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Request body is required. Please provide the necessary data.'
      );
    });
  });
});
