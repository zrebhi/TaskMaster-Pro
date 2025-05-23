const request = require("supertest");
const app = require("../server"); // Adjust path as necessary
const jwt = require("jsonwebtoken");
const { User, Project, sequelize } = require("../models"); // Adjust path as necessary
const { v4: uuidv4 } = require("uuid");

describe("Project Routes - /api/projects", () => {
  let testUser;
  let testUserToken;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        "NODE_ENV not set to 'test'. Aborting to prevent data loss. Ensure your test script sets NODE_ENV=test."
      );
    }
    if (!process.env.TEST_DB_NAME) {
      console.warn(`
WARNING: Your test database name in .env (DB_NAME=${process.env.DB_NAME}) does not appear to be a dedicated test database (e.g., ending in '_test').
Running tests against a non-test database can lead to data loss.
Please ensure you have a separate database configured for testing in your .env file and backend/config/config.js.
Proceeding with caution...
        `);
    }

    try {
      await sequelize.authenticate(); // Check connection
      // Using sync({ force: true }) is destructive.
      // In a real-world scenario, use migrations and a dedicated test DB.
      await sequelize.sync({ force: true });
      console.log("Test database synced successfully.");

      // Create a mock user for testing
      testUser = await User.create({
        id: uuidv4(),
        username: "testuser_project",
        email: "testuser_project@example.com",
        password_hash: "hashed_password_project_test", // Not used for token generation here
      });

      // Generate a token for the mock user
      // Sign the token with the same secret the middleware will use for verification
      testUserToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
    } catch (error) {
      console.error("Failed to initialize test database:", error);
      process.exit(1); // Exit if DB setup fails
    }
  });

  afterEach(async () => {
    // Clean up projects created during tests
    await Project.destroy({ where: {}, truncate: true, cascade: true });
  });

  afterAll(async () => {
    // Clean up the test user
    if (testUser) {
      await User.destroy({ where: { id: testUser.id } });
    }
    // Close the database connection
    await sequelize.close();
  });

  describe("POST /api/projects - Create a new project", () => {
    it("should return 401 if no token is provided", async () => {
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error for this test
      
      const res = await request(app)
        .post("/api/projects")
        .send({ name: "New Project Without Token" });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, no token");

      consoleErrorSpy.mockRestore(); // Restore original console.error
    });

    it("should return 401 if an invalid token is provided", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {}); // Suppress console.error for this test

      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", "Bearer invalidtoken123")
        .send({ name: "New Project Invalid Token" });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, token failed");

      consoleErrorSpy.mockRestore(); // Restore original console.error
    });

    it("should return 400 if project name is missing", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({}); // No name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is required.");
    });

    it("should return 400 if project name is empty string", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: "   " }); // Empty name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is required.");
    });

    it("should return 400 if project name is too long (over 255 chars)", async () => {
      const longName = "a".repeat(256);
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: longName });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is too long.");
    });

    it("should create a project successfully with a valid token and name", async () => {
      const projectName = "My First Test Project";
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: projectName });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe("Project created successfully.");
      expect(res.body.project).toBeDefined();
      expect(res.body.project.name).toBe(projectName);
      expect(res.body.project.user_id).toBe(testUser.id);

      // Verify the project was actually saved in the database
      const dbProject = await Project.findByPk(res.body.project.id);
      expect(dbProject).not.toBeNull();
      expect(dbProject.name).toBe(projectName);
      expect(dbProject.user_id).toBe(testUser.id);
    });

    it("should correctly associate the created project with the authenticated user", async () => {
      const projectName = "User Association Test Project";
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: projectName });

      expect(res.statusCode).toEqual(201);
      expect(res.body.project.user_id).toBe(testUser.id);

      const projectInDb = await Project.findOne({
        where: { name: projectName },
      });
      expect(projectInDb).not.toBeNull();
      expect(projectInDb.user_id).toBe(testUser.id);
    });
  });
});
