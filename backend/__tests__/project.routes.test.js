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

  describe("GET /api/projects - Get all projects for the authenticated user", () => {
    it("should return 401 if no token is provided", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app).get("/api/projects");
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, no token");
      consoleErrorSpy.mockRestore();
    });

    it("should return 401 if an invalid token is provided", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", "Bearer invalidtoken123");
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, token failed");
      consoleErrorSpy.mockRestore();
    });

    it("should return an empty array if the user has no projects", async () => {
      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Projects fetched successfully.");
      expect(res.body.count).toBe(0);
      expect(res.body.projects).toEqual([]);
    });

    it("should return projects for the authenticated user", async () => {
      // Create some projects for the test user
      await Project.create({ name: "Project 1", user_id: testUser.id });
      await Project.create({ name: "Project 2", user_id: testUser.id });

      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Projects fetched successfully.");
      expect(res.body.count).toBe(2);
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.projects[0].name).toBe("Project 2"); // Ordered by createdAt DESC
      expect(res.body.projects[1].name).toBe("Project 1");
      expect(res.body.projects.every(p => p.user_id === testUser.id)).toBe(true);
    });

    it("should not return projects belonging to other users", async () => {
      // Create a project for the test user
      await Project.create({ name: "My Project", user_id: testUser.id });

      // Create another user and their project
      const otherUser = await User.create({
        id: uuidv4(),
        username: "otheruser_project_get",
        email: "otheruser_project_get@example.com",
        password_hash: "hashed_password_other",
      });
      await Project.create({ name: "Other User Project", user_id: otherUser.id });

      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toBe(1);
      expect(res.body.projects).toHaveLength(1);
      expect(res.body.projects[0].name).toBe("My Project");
      expect(res.body.projects[0].user_id).toBe(testUser.id);

      // Clean up other user
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe("PUT /api/projects/:projectId - Update a project", () => {
    let projectToUpdate;

    beforeEach(async () => {
      // Create a project for the test user before each update test
      projectToUpdate = await Project.create({
        name: "Original Project Name",
        user_id: testUser.id,
      });
      jest.clearAllMocks();
    });

    it("should return 401 if no token is provided", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .send({ name: "Updated Name Without Token" });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, no token");
    });

    it("should return 401 if an invalid token is provided", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set("Authorization", "Bearer invalidtoken123")
        .send({ name: "Updated Name Invalid Token" });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Not authorized, token failed");
    });

    it("should return 404 if the project ID does not exist", async () => {
      const nonExistentProjectId = uuidv4();
      const res = await request(app)
        .put(`/api/projects/${nonExistentProjectId}`)
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: "Attempt Update Non-existent" });
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("Project not found.");
    });

    it("should return 403 if the user tries to update a project they do not own", async () => {
      // Create another user and their project
      const otherUser = await User.create({
        id: uuidv4(),
        username: "otheruser_project_update",
        email: "otheruser_project_update@example.com",
        password_hash: "hashed_password_other_update",
      });
      const otherUserProject = await Project.create({
        name: "Other User's Project",
        user_id: otherUser.id,
      });

      const res = await request(app)
        .put(`/api/projects/${otherUserProject.id}`)
        .set("Authorization", `Bearer ${testUserToken}`) // Using testUser's token
        .send({ name: "Attempt to update other user's project" });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe("User not authorized to update this project.");

      // Clean up other user and their project
      await Project.destroy({ where: { id: otherUserProject.id } });
      await User.destroy({ where: { id: otherUser.id } });
    });

    it("should return 400 if the new project name is missing", async () => {
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({}); // No name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is required.");
    });

    it("should return 400 if the new project name is an empty string", async () => {
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: "   " }); // Empty name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is required.");
    });

    it("should return 400 if the new project name is too long (over 255 chars)", async () => {
      const longName = "b".repeat(256);
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: longName });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Project name is too long.");
    });

    it("should update a project successfully with a valid token and new name", async () => {
      const newProjectName = "Updated Project Name";
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set("Authorization", `Bearer ${testUserToken}`)
        .send({ name: newProjectName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Project updated successfully.");
      expect(res.body.project).toBeDefined();
      expect(res.body.project.id).toBe(projectToUpdate.id);
      expect(res.body.project.name).toBe(newProjectName);
      expect(res.body.project.user_id).toBe(testUser.id);

      // Verify the project was actually updated in the database
      const dbProject = await Project.findByPk(projectToUpdate.id);
      expect(dbProject).not.toBeNull();
      expect(dbProject.name).toBe(newProjectName);
      expect(dbProject.user_id).toBe(testUser.id);
    });
  });
});
