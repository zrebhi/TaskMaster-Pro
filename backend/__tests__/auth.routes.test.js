const request = require("supertest");
const app = require("../server");
const { User, sequelize } = require("../models");
const bcrypt = require("bcryptjs"); // Real bcrypt
const jwt = require("jsonwebtoken"); // Real jwt
const { v4: uuidv4 } = require("uuid");

describe("Authentication Routes - /api/auth", () => {
  // Setup for database connection and cleanup
  beforeAll(async () => {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        "NODE_ENV not set to 'test'. Aborting to prevent data loss."
      );
    }
    // Ensure JWT_SECRET is set for token generation/verification
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not set. Please set it in your .env file for testing.");
    }
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: true }); // This clears the database
      console.log("Test database synced successfully for auth tests.");
    } catch (error) {
      console.error("Failed to initialize test database for auth tests:", error);
      process.exit(1);
    }
  });

  // Clean up users after each test to ensure isolation
  afterEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  // Close database connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully with valid data", async () => {
      const userData = {
        username: "testuser_register",
        email: "register@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully."
      );
      expect(response.body).toHaveProperty("userId");
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

    test("should return 400 if required fields are missing (e.g., email)", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser_missing_fields",
        password: "password123",
        // email missing
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide username, email, and password."
      );
    });
    
    test("should return 400 for invalid username format (e.g. contains @)", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "test@user", // Invalid char
        email: "invaliduser@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(400);
      // The exact message might depend on your validation logic in the controller
      expect(response.body).toHaveProperty("message"); 
      // Example: "Username can only contain letters, numbers, underscores, and hyphens."
    });


    test("should return 409 if email already exists", async () => {
      const existingUserData = {
        id: uuidv4(),
        username: "existinguser",
        email: "existing@example.com",
        password_hash: await bcrypt.hash("password123", 10),
      };
      await User.create(existingUserData);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app).post("/api/auth/register").send({
        username: "newuser",
        email: "existing@example.com", // Same email
        password: "password456",
      });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toContain(
        `email '${existingUserData.email}' already exists`
      );
      consoleErrorSpy.mockRestore();
    });

     test("should return 409 if username already exists", async () => {
      const existingUserData = {
        id: uuidv4(),
        username: "existing_username",
        email: "unique_email@example.com",
        password_hash: await bcrypt.hash("password123", 10),
      };
      await User.create(existingUserData);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app).post("/api/auth/register").send({
        username: "existing_username", // Same username
        email: "another_unique_email@example.com",
        password: "password456",
      });
      
      expect(response.statusCode).toBe(409);
      expect(response.body.message).toContain(
        `username '${existingUserData.username}' already exists`
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("POST /api/auth/login", () => {
    let testUserLogin;
    const loginPassword = "loginPassword123";

    beforeEach(async () => {
      // Create a user to login with before each login test
      const hashedPassword = await bcrypt.hash(loginPassword, 10);
      testUserLogin = await User.create({
        id: uuidv4(),
        username: "loginuser",
        email: "login@example.com",
        password_hash: hashedPassword,
      });
    });

    test("should login a user successfully with valid email and password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUserLogin.email,
        password: loginPassword,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful.");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("expiresAt");
      expect(response.body.user).toHaveProperty("id", testUserLogin.id);
      expect(response.body.user).toHaveProperty("username", testUserLogin.username);
      expect(response.body.user).toHaveProperty("email", testUserLogin.email);

      // Optionally, verify the token
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decodedToken.userId).toBe(testUserLogin.id);
      expect(decodedToken.username).toBe(testUserLogin.username);
    });

    test("should login a user successfully with valid username and password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: testUserLogin.username,
        password: loginPassword,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful.");
      expect(response.body).toHaveProperty("token");
      // ... other assertions as above
    });

    test("should return 401 if user is not found (wrong email)", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: loginPassword,
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials.");
    });
    
    test("should return 401 if user is not found (wrong username)", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "nonexistent_username",
        password: loginPassword,
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials.");
    });


    test("should return 401 if password is incorrect", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUserLogin.email,
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials.");
    });

    test("should return 400 if required fields are missing (e.g. password)", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUserLogin.email,
        // password missing
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Please provide email or username, and password."
      );
    });
  });
});
