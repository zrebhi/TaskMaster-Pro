const request = require('supertest');
const app = require('../../../server');
const { User } = require('../../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const databaseTestHelper = require('../../helpers/database');
const { createUser } = require('../../helpers/testDataFactory');

const withConsoleErrorSpy = (testFn) => {
  return async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      await testFn();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  };
};

describe('Authentication Routes Integration - /api/auth', () => {
  let testUser;

  beforeEach(async () => {
    const userData = await createUser({
      username: 'globaltestuser',
      email: 'globaltestuser@example.com',
    });

    testUser = userData.user;
  });

  afterEach(async () => {
    await databaseTestHelper.truncateAllTables();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register - Integration Scenarios', () => {
    test('should complete full registration flow with database persistence', async () => {
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

    test(
      'should handle database unique constraint violation for email',
      withConsoleErrorSpy(async () => {
        const response = await request(app).post('/api/auth/register').send({
          username: 'newuser',
          email: testUser.email,
          password: 'password456',
        });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toContain(
          `email '${testUser.email}' already exists`
        );
      })
    );

    test(
      'should handle database unique constraint violation for username',
      withConsoleErrorSpy(async () => {
        const response = await request(app).post('/api/auth/register').send({
          username: testUser.username,
          email: 'another_unique_email@example.com',
          password: 'password456',
        });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toContain(
          `username '${testUser.username}' already exists`
        );
      })
    );
  });

  describe('POST /api/auth/login - Integration Scenarios', () => {
    test('should complete full login flow with JWT generation and verification', async () => {
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

    test('should support login with username instead of email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: testUser.username,
        password: 'testpassword123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful.');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id', testUser.id);
    });
  });

  describe('Full Authentication Flow Integration', () => {
    test('should complete register -> login -> protected route flow', async () => {
      // Step 1: Register a new user
      const userData = {
        username: 'flowtest_user',
        email: 'flowtest@example.com',
        password: 'password123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.statusCode).toBe(201);
      expect(registerResponse.body).toHaveProperty('userId');

      // Step 2: Login with the new user
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      const token = loginResponse.body.token;

      // Step 3: Access a protected route (using projects endpoint as example)
      const protectedResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      // Should not get 401 (unauthorized) - exact response depends on tasks implementation
      expect(protectedResponse.statusCode).not.toBe(401);
    });

    test(
      'should handle error propagation through middleware stack',
      withConsoleErrorSpy(async () => {
        const response = await request(app).post('/api/auth/register').send({
          username: testUser.username,
          email: 'different@example.com',
          password: 'password123',
        });

        expect(response.statusCode).toBe(409);
        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('errorCode', 'CONFLICT_ERROR');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.message).toContain('already exists');
      })
    );
  });
});
