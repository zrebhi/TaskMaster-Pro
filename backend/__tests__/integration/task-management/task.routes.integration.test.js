const request = require('supertest');
const app = require('../../../server');
const { Project, Task } = require('../../../models');
const databaseTestHelper = require('../../helpers/database');
const { createUser } = require('../../helpers/testDataFactory');

describe('Tasks API Integration Tests', () => {
  let testUser;
  let otherUser;
  let testUserToken;
  let otherUserToken;
  let testProject;
  let otherUsersProject;
  let testTask;

  beforeAll(async () => {
    await databaseTestHelper.initialize();
  });

  afterAll(async () => {
    await databaseTestHelper.close();
  });

  beforeEach(async () => {
    await databaseTestHelper.truncateAllTables();

    // Create users
    ({ user: testUser, token: testUserToken } = await createUser());
    ({ user: otherUser, token: otherUserToken } = await createUser());

    // Create projects
    testProject = await Project.create({
      name: 'Test Project',
      user_id: testUser.id,
    });
    otherUsersProject = await Project.create({
      name: "Other User's Project",
      user_id: otherUser.id,
    });

    // Create a task
    testTask = await Task.create({
      title: 'Initial Task',
      project_id: testProject.id,
    });
  });

  // Suppress console output for expected errors
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a new task and return 201 Created for an authorized user', async () => {
      const taskData = { title: 'A New Task', priority: 3 };
      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(res.statusCode).toBe(201);
      expect(res.body.task).toBeDefined();
      expect(res.body.task.title).toBe('A New Task');
      expect(res.body.task.project_id).toBe(testProject.id);
      const taskInDb = await Task.findByPk(res.body.task.id);
      expect(taskInDb).not.toBeNull();
    });

    it('should return 400 Bad Request if the title is missing or empty', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Task title is required');
    });

    it('should return 401 Unauthorized if the request has no auth token', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .send({ title: 'No Auth Task' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 Forbidden if the user does not own the project', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Forbidden Task' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 Not Found if the project ID does not exist', async () => {
      const nonExistentProjectId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const res = await request(app)
        .post(`/api/projects/${nonExistentProjectId}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Task for non-existent project' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:taskId', () => {
    it('should update task fields and return 200 OK for an authorized user', async () => {
      const updateData = { title: 'Updated Title', is_completed: true };
      const res = await request(app)
        .patch(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.task.title).toBe('Updated Title');
      expect(res.body.task.is_completed).toBe(true);
      const taskInDb = await Task.findByPk(testTask.id);
      expect(taskInDb.title).toBe('Updated Title');
    });

    it('should return 401 Unauthorized if the request has no auth token', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTask.id}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 Forbidden if the user does not own the task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Forbidden Update' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 Not Found if the task ID does not exist', async () => {
      const nonExistentTaskId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const res = await request(app)
        .patch(`/api/tasks/${nonExistentTaskId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Update for non-existent task' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 Bad Request for invalid data types (e.g., invalid priority)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ priority: 99 }); // Invalid priority

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Priority must be');
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete the task and return 200 OK for an authorized user', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Task deleted successfully.');
      const taskInDb = await Task.findByPk(testTask.id);
      expect(taskInDb).toBeNull();
    });

    it('should return 401 Unauthorized if the request has no auth token', async () => {
      const res = await request(app).delete(`/api/tasks/${testTask.id}`);
      expect(res.statusCode).toBe(401);
    });

    it('should return 403 Forbidden if the user does not own the task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should return 404 Not Found if the task ID does not exist', async () => {
      const nonExistentTaskId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const res = await request(app)
        .delete(`/api/tasks/${nonExistentTaskId}`)
        .set('Authorization', `Bearer ${testUserToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Database Cascade Behavior', () => {
    it('should cascade delete all tasks when parent project is deleted', async () => {
      // Arrange: Create another task to ensure multiple are deleted
      await Task.create({ title: 'Task 2', project_id: testProject.id });
      const tasksBeforeDelete = await Task.findAll({ where: { project_id: testProject.id } });
      expect(tasksBeforeDelete.length).toBe(2);

      // Act: Delete the parent project
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      // Assert: Verify tasks are automatically deleted
      const tasksAfterDelete = await Task.findAll({ where: { project_id: testProject.id } });
      expect(tasksAfterDelete.length).toBe(0);
    });
  });
});
