const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const sequelize = require("../config/database");

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Authentication Routes - /api/auth", () => {
  // Clear all mocks before each test to ensure test isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    test("should register a new user successfully with valid data", async () => {
      const mockNewUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        // password_hash is not returned by create, but id is
      };
      // Configure User.create to resolve with the mock user
      User.create.mockResolvedValue(mockNewUser);
      bcrypt.hash.mockResolvedValue("mocked_hashed_password");
      // Configure User.findOne to resolve with null (user doesn't exist yet)
      // This is relevant for controllers that check if user exists before creation
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully."
      );
      expect(response.body).toHaveProperty("userId", mockNewUser.id);
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "testuser",
          email: "test@example.com",
          password_hash: "mocked_hashed_password",
        })
      );
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        // email and password missing
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide username, email, and password."
      );
    });

    test("should return 400 for invalid username format", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "test@user", // Invalid char
        email: "test@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Username can only contain letters, numbers, underscores, and hyphens."
      );
    });

    test("should return 409 if email already exists", async () => {
      // Spy on console.error and provide a mock implementation for this test
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      User.create.mockRejectedValue({
        name: "SequelizeUniqueConstraintError",
        errors: [
          {
            path: "email",
            value: "test@example.com",
            message: "email must be unique",
          },
        ],
      });

      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toContain(
        "email 'test@example.com' already exists"
      );

      // Restore the original console.error implementation
      consoleErrorSpy.mockRestore();
    });
  });

  describe("POST /login", () => {
    test("should login a user successfully with valid email and password", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password_hash: "hashedpassword",
      };
      const mockToken = "fake-jwt-token";
      const mockExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);
      jwt.decode.mockReturnValue({ exp: mockExpiresAt });

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful.");
      expect(response.body).toHaveProperty("token", mockToken);
      expect(response.body).toHaveProperty("expiresAt", mockExpiresAt);
      expect(response.body.user).toHaveProperty("id", mockUser.id);
      expect(response.body.user).toHaveProperty("username", mockUser.username);
      expect(response.body.user).toHaveProperty("email", mockUser.email);
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          username: mockUser.username,
        }),
        expect.any(String), // JWT_SECRET
        expect.any(Object) // JWT_OPTIONS
      );
    });

    test("should login a user successfully with valid username and password", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password_hash: "hashedpassword",
      };
      const mockToken = "fake-jwt-token";
      const mockExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);
      jwt.decode.mockReturnValue({ exp: mockExpiresAt });

      const response = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "password123",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful.");
      expect(response.body).toHaveProperty("token", mockToken);
      expect(response.body).toHaveProperty("expiresAt", mockExpiresAt);
      expect(response.body.user).toHaveProperty("id", mockUser.id);
      expect(response.body.user).toHaveProperty("username", mockUser.username);
      expect(response.body.user).toHaveProperty("email", mockUser.email);
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          username: mockUser.username,
        }),
        expect.any(String), // JWT_SECRET
        expect.any(Object) // JWT_OPTIONS
      );
    });

    test("should return 401 if user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials.");
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("should return 401 if password is incorrect", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password_hash: "hashedpassword",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials.");
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("should return 400 if required fields are missing (email/username or password)", async () => {
      // Missing password
      let response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide email or username, and password."
      );

      // Missing email and username
      response = await request(app).post("/api/auth/login").send({
        password: "password123",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide email or username, and password."
      );

      // Missing all fields
      response = await request(app).post("/api/auth/login").send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide email or username, and password."
      );

      expect(User.findOne).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await sequelize.close(); // Close the database connection after all tests
  });
});
