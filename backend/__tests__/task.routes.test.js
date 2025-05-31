const request = require('supertest');
const app = require('../server');
const { Project, Task } = require('../models');
const { v4: uuidv4 } = require('uuid');
const databaseTestHelper = require('./helpers/database');
const { createUser } = require('./helpers/testDataFactory');

describe('Task Routes - /api/projects/:projectId/tasks', () => {
  let testUser;
  let testUserToken;
  let testProject;
  let otherUser;
  let otherProject;

  beforeEach(async () => {
    // Create test user and project
    const userData = await createUser({
      username: 'taskuser',
      email: 'taskuser@example.com',
    });

    testUser = userData.user;
    testUserToken = userData.token;

    // Create test project owned by testUser
    testProject = await Project.create({
      name: 'Test Project for Tasks',
      user_id: testUser.id,
    });

    // Create other user and project for authorization tests
    const otherUserData = await createUser({
      username: 'otheruser',
      email: 'otheruser@example.com',
    });

    otherUser = otherUserData.user;
    otherProject = await Project.create({
      name: 'Other User Project',
      user_id: otherUser.id,
    });
  });

  afterEach(async () => {
    await databaseTestHelper.truncateAllTables();
    jest.clearAllMocks();
  });

  describe('POST /api/projects/:projectId/tasks - Create a new task', () => {
    it('should create task successfully with valid data and project ownership', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Task description for testing',
        due_date: '2024-12-31',
        priority: 3,
      };

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Task created successfully.');
      expect(res.body.task).toBeDefined();
      expect(res.body.task.title).toBe(taskData.title);
      expect(res.body.task.description).toBe(taskData.description);
      expect(res.body.task.project_id).toBe(testProject.id);
      expect(res.body.task.priority).toBe(taskData.priority);

      // Verify task was created in database
      const dbTask = await Task.findByPk(res.body.task.id);
      expect(dbTask).not.toBeNull();
      expect(dbTask.title).toBe(taskData.title);
      expect(dbTask.project_id).toBe(testProject.id);
    });

    it('should create task with minimal required data (title only)', async () => {
      const taskData = { title: 'Minimal Task' };

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.task.title).toBe(taskData.title);
      expect(res.body.task.project_id).toBe(testProject.id);
      expect(res.body.task.priority).toBe(2); // Default priority
    });

    it('should return 401 if no authentication token is provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .send({ title: 'Unauthorized Task' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');

      consoleErrorSpy.mockRestore();
    });

    it('should return 401 if invalid authentication token is provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', 'Bearer invalidtoken123')
        .send({ title: 'Invalid Token Task' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');

      consoleErrorSpy.mockRestore();
    });

    it('should return 403 if user does not own the project', async () => {
      const taskData = { title: 'Unauthorized Task Creation' };

      const res = await request(app)
        .post(`/api/projects/${otherProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe(
        "User not authorized to access or modify this project's resources."
      );

      // Verify no task was created
      const tasks = await Task.findAll({ where: { project_id: otherProject.id } });
      expect(tasks).toHaveLength(0);
    });

    it('should return 404 if project does not exist', async () => {
      const nonExistentProjectId = uuidv4();
      const taskData = { title: 'Task for Non-existent Project' };

      const res = await request(app)
        .post(`/api/projects/${nonExistentProjectId}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found.');
    });

    it('should return 400 if task title is missing', async () => {
      const taskData = { description: 'Task without title' };

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Task title is required.');
    });

    it('should return 400 if task title is empty string', async () => {
      const taskData = { title: '   ', description: 'Empty title task' };

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Task title is required.');
    });

    it('should trim whitespace from task title and description', async () => {
      const taskData = {
        title: '  Whitespace Task  ',
        description: '  Description with spaces  ',
      };

      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.task.title).toBe('Whitespace Task');
      expect(res.body.task.description).toBe('Description with spaces');
    });
  });

  describe('GET /api/projects/:projectId/tasks - Get tasks for a project', () => {
    beforeEach(async () => {
      // Create some test tasks for the project
      await Task.create({
        title: 'First Task',
        description: 'First task description',
        project_id: testProject.id,
        priority: 1,
      });

      await Task.create({
        title: 'Second Task',
        description: 'Second task description',
        project_id: testProject.id,
        priority: 2,
      });
    });

    it('should fetch tasks successfully when user owns the project', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Tasks fetched successfully.');
      expect(res.body.count).toBe(2);
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.tasks[0].title).toBe('First Task');
      expect(res.body.tasks[1].title).toBe('Second Task');
      expect(res.body.tasks.every(task => task.project_id === testProject.id)).toBe(true);
    });

    it('should return empty array when project has no tasks', async () => {
      // Clear tasks from the project
      await Task.destroy({ where: { project_id: testProject.id } });

      const res = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Tasks fetched successfully.');
      expect(res.body.count).toBe(0);
      expect(res.body.tasks).toEqual([]);
    });

    it('should return 401 if no authentication token is provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app).get(`/api/projects/${testProject.id}/tasks`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');

      consoleErrorSpy.mockRestore();
    });

    it('should return 401 if invalid authentication token is provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, token failed');

      consoleErrorSpy.mockRestore();
    });

    it('should return 403 if user does not own the project', async () => {
      const res = await request(app)
        .get(`/api/projects/${otherProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe(
        "User not authorized to access or modify this project's resources."
      );
    });

    it('should return 404 if project does not exist', async () => {
      const nonExistentProjectId = uuidv4();

      const res = await request(app)
        .get(`/api/projects/${nonExistentProjectId}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found.');
    });

    it('should not return tasks from other projects', async () => {
      // Create tasks for other project
      await Task.create({
        title: 'Other Project Task',
        project_id: otherProject.id,
        priority: 1,
      });

      const res = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toBe(2); // Only tasks from testProject
      expect(res.body.tasks.every(task => task.project_id === testProject.id)).toBe(true);
      expect(res.body.tasks.some(task => task.title === 'Other Project Task')).toBe(false);
    });
  });
});
