const request = require('supertest');
const app = require('../server');
const { User, Project } = require('../models');
const { v4: uuidv4 } = require('uuid');
const databaseTestHelper = require('./helpers/database');
const { createUser } = require('./helpers/testDataFactory');

describe('Project Routes - /api/projects', () => {
  let testUser;
  let testUserToken;

  beforeEach(async () => {
    // Create a test user for this test suite
    const userData = await createUser({
      username: 'globaltestuser',
      email: 'globaltestuser@example.com',
    });

    testUser = userData.user;
    testUserToken = userData.token;
  });

  afterEach(async () => {
    // Clean up test data manually
    await databaseTestHelper.truncateAllTables();
    jest.clearAllMocks();
  });
  describe('POST /api/projects - Create a new project', () => {
    it('should return 401 if no token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'New Project Without Token' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');

      consoleErrorSpy.mockRestore();
    });

    it('should return 401 if an invalid token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer invalidtoken123')
        .send({ name: 'New Project Invalid Token' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
      consoleErrorSpy.mockRestore();
    });

    it('should return 400 if project name is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ description: 'Project without name' }); // Body exists but no name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is required.');
    });

    it('should return 400 if project name is empty string', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: '   ' }); // Empty name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is required.');
    });

    it('should return 400 when request body is empty', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({}); // Empty body
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe(
        'Request body is required. Please provide the necessary data.'
      );
    });

    it('should return 400 when no request body is provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`);
      // No .send() call - no body
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe(
        'Request body is required. Please provide the necessary data.'
      );
    });

    it('should return 400 if project name is too long (over 255 chars)', async () => {
      const longName = 'a'.repeat(256);
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: longName });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is too long.');
    });

    it('should create a project successfully with a valid token and name', async () => {
      const projectName = 'My First Test Project';
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: projectName });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Project created successfully.');
      expect(res.body.project).toBeDefined();
      expect(res.body.project.name).toBe(projectName);
      expect(res.body.project.user_id).toBe(testUser.id);

      // Verify the project was actually saved in the database
      const dbProject = await Project.findByPk(res.body.project.id);
      expect(dbProject).not.toBeNull();
      expect(dbProject.name).toBe(projectName);
      expect(dbProject.user_id).toBe(testUser.id);
    });

    it('should correctly associate the created project with the authenticated user', async () => {
      const projectName = 'User Association Test Project';
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
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

  describe('GET /api/projects - Get all projects for the authenticated user', () => {
    it('should return 401 if no token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');
      consoleErrorSpy.mockRestore();
    });

    it('should return 401 if an invalid token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
      consoleErrorSpy.mockRestore();
    });

    it('should return an empty array if the user has no projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Projects fetched successfully.');
      expect(res.body.count).toBe(0);
      expect(res.body.projects).toEqual([]);
    });

    it('should return projects for the authenticated user', async () => {
      // Create some projects for the test user
      await Project.create({ name: 'Project 1', user_id: testUser.id });
      await Project.create({ name: 'Project 2', user_id: testUser.id });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Projects fetched successfully.');
      expect(res.body.count).toBe(2);
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.projects[0].name).toBe('Project 2'); // Ordered by createdAt DESC
      expect(res.body.projects[1].name).toBe('Project 1');
      expect(res.body.projects.every((p) => p.user_id === testUser.id)).toBe(
        true
      );
    });

    it('should not return projects belonging to other users', async () => {
      // Create a project for the test user
      await Project.create({ name: 'My Project', user_id: testUser.id });

      // Create another user and their project
      const otherUser = await User.create({
        id: uuidv4(),
        username: 'otheruser_project_get',
        email: 'otheruser_project_get@example.com',
        password_hash: 'hashed_password_other',
      });
      await Project.create({
        name: 'Other User Project',
        user_id: otherUser.id,
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toBe(1);
      expect(res.body.projects).toHaveLength(1);
      expect(res.body.projects[0].name).toBe('My Project');
      expect(res.body.projects[0].user_id).toBe(testUser.id);
    });
  });

  describe('PUT /api/projects/:projectId - Update a project', () => {
    let projectToUpdate;

    beforeEach(async () => {
      // Create a project for the test user before each update test
      projectToUpdate = await Project.create({
        name: 'Original Project Name',
        user_id: testUser.id,
      });
      jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .send({ name: 'Updated Name Without Token' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 if an invalid token is provided', async () => {
      // Suppress console.error for this test to avoid cluttering output
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', 'Bearer invalidtoken123')
        .send({ name: 'Updated Name Invalid Token' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('should return 404 if the project ID does not exist', async () => {
      const nonExistentProjectId = uuidv4();
      const res = await request(app)
        .put(`/api/projects/${nonExistentProjectId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: 'Attempt Update Non-existent' });
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found.');
    });

    it('should return 403 if the user tries to update a project they do not own', async () => {
      // Create another user and their project
      const otherUser = await User.create({
        id: uuidv4(),
        username: 'otheruser_project_update',
        email: 'otheruser_project_update@example.com',
        password_hash: 'hashed_password_other_update',
      });
      const otherUserProject = await Project.create({
        name: "Other User's Project",
        user_id: otherUser.id,
      });

      const res = await request(app)
        .put(`/api/projects/${otherUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`) // Using testUser's token
        .send({ name: "Attempt to update other user's project" });
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe(
        "User not authorized to access or modify this project's resources."
      );
    });

    it('should return 400 if the new project name is missing', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({}); // No name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe(
        'Request body is required. Please provide the necessary data.'
      );
    });

    it('should return 400 when no request body is provided', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);
      // No .send() call - no body
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe(
        'Request body is required. Please provide the necessary data.'
      );
    });

    it('should return 400 if the new project name is an empty string', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: '   ' }); // Empty name
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is required.');
    });

    it('should return 400 if the new project name is too long (over 255 chars)', async () => {
      const longName = 'b'.repeat(256);
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: longName });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is too long.');
    });

    it('should update a project successfully with a valid token and new name', async () => {
      const newProjectName = 'Updated Project Name';
      const res = await request(app)
        .put(`/api/projects/${projectToUpdate.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: newProjectName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Project updated successfully.');
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

describe('DELETE /api/projects/:projectId - Delete a project', () => {
  let projectToDelete;
  let testUser;
  let testUserToken;

  beforeEach(async () => {
    // Create a test user for this test suite
    const userData = await createUser({
      username: 'globaltestuser',
      email: 'globaltestuser@example.com',
    });

    testUser = userData.user;
    testUserToken = userData.token;

    // Create a project for the test user before each delete test
    projectToDelete = await Project.create({
      name: 'Project to Delete',
      user_id: testUser.id,
    });
    // TODO: Add tasks associated with this project for cascade delete testing
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data manually
    await databaseTestHelper.truncateAllTables();
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const res = await request(app).delete(
      `/api/projects/${projectToDelete.id}`
    );
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Not authorized, no token');
    consoleErrorSpy.mockRestore();
  });

  it('should return 401 if an invalid token is provided', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const res = await request(app)
      .delete(`/api/projects/${projectToDelete.id}`)
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Not authorized, token failed');
    consoleErrorSpy.mockRestore();
  });

  it('should return 404 if the project ID does not exist', async () => {
    const nonExistentProjectId = uuidv4();
    const res = await request(app)
      .delete(`/api/projects/${nonExistentProjectId}`)
      .set('Authorization', `Bearer ${testUserToken}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Project not found.');
  });

  it('should return 403 if the user tries to delete a project they do not own', async () => {
    // Create another user and their project
    const otherUser = await User.create({
      id: uuidv4(),
      username: 'otheruser_project_delete',
      email: 'otheruser_project_delete@example.com',
      password_hash: 'hashed_password_other_delete',
    });
    const otherUserProject = await Project.create({
      name: "Other User's Project to Delete",
      user_id: otherUser.id,
    });

    const res = await request(app)
      .delete(`/api/projects/${otherUserProject.id}`)
      .set('Authorization', `Bearer ${testUserToken}`); // Using testUser's token
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "User not authorized to access or modify this project's resources."
    );
  });

  it('should delete a project successfully with a valid token and project ID', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectToDelete.id}`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe(
      'Project and associated tasks deleted successfully.'
    );

    // Verify the project was actually deleted from the database
    const dbProject = await Project.findByPk(projectToDelete.id);
    expect(dbProject).toBeNull();

    // TODO: Verify associated tasks are deleted (requires Task model and creating tasks in beforeEach)
  });
});
