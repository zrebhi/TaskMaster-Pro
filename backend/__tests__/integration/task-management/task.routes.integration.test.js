const request = require('supertest');
const app = require('../../../server');
const { Project, Task } = require('../../../models');
const databaseTestHelper = require('../../helpers/database');
const { createUser } = require('../../helpers/testDataFactory');

describe('Task Routes Integration Tests', () => {
  let testUser;
  let testUserToken;
  let testProject;
  let otherUserToken;

  beforeAll(async () => {
    await databaseTestHelper.initialize();
  });

  afterAll(async () => {
    await databaseTestHelper.close();
  });

  beforeEach(async () => {
    await databaseTestHelper.truncateAllTables();

    // Create test users
    const testUserData = await createUser();
    testUser = testUserData.user;
    testUserToken = testUserData.token;

    const otherUserData = await createUser();
    otherUserToken = otherUserData.token;

    // Create test projects
    testProject = await Project.create({
      name: 'Test Project',
      description: 'Project for testing',
      user_id: testUser.id,
    });

  });

  describe('Database Relationship Integration', () => {
    it('should cascade delete all tasks when parent project is deleted', async () => {
      // Arrange: Create multiple tasks for the project
      const task1Data = {
        title: 'Task 1',
        description: 'First task',
        priority: 1,
      };
      const task2Data = {
        title: 'Task 2',
        description: 'Second task',
        priority: 2,
      };

      await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(task1Data);

      await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(task2Data);

      // Verify tasks exist before deletion
      const tasksBeforeDelete = await Task.findAll({
        where: { project_id: testProject.id },
      });
      expect(tasksBeforeDelete).toHaveLength(2);

      // Act: Delete the parent project
      const deleteRes = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(deleteRes.statusCode).toBe(200);

      // Assert: Verify tasks are automatically deleted by database CASCADE
      const tasksAfterDelete = await Task.findAll({
        where: { project_id: testProject.id },
      });
      expect(tasksAfterDelete).toHaveLength(0);
    });
  });

  describe('Cross-Route Data Consistency Integration', () => {
    it('should maintain data consistency through complete task lifecycle', async () => {
      // Create task via project route
      const createTaskData = {
        title: 'Lifecycle Test Task',
        description: 'Original description',
        priority: 1,
        due_date: '2024-12-31',
      };

      const createRes = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(createTaskData);

      expect(createRes.statusCode).toBe(201);
      const taskId = createRes.body.task.id;

      // Verify task appears in project tasks list with correct data
      const getRes = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(getRes.statusCode).toBe(200);
      const createdTask = getRes.body.tasks.find((task) => task.id === taskId);
      expect(createdTask).toBeDefined();
      expect(createdTask.title).toBe('Lifecycle Test Task');
      expect(createdTask.description).toBe('Original description');
      expect(createdTask.priority).toBe(1);
      expect(createdTask.due_date).toBe('2024-12-31');
      expect(createdTask.is_completed).toBe(false);

      // Update task via task route
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 3,
        is_completed: true,
      };

      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(updateRes.statusCode).toBe(200);

      // Verify updates appear in project tasks list
      const getUpdatedRes = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(getUpdatedRes.statusCode).toBe(200);
      const updatedTask = getUpdatedRes.body.tasks.find(
        (task) => task.id === taskId
      );
      expect(updatedTask.title).toBe('Updated Task Title');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.priority).toBe(3);
      expect(updatedTask.is_completed).toBe(true);
      expect(updatedTask.due_date).toBe('2024-12-31'); // Should remain unchanged
    });
  });

  describe('Authentication & Authorization Flow Integration', () => {
    it('should enforce complete auth chain for task operations', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a task in testUser's project
      const taskData = {
        title: 'Auth Test Task',
        priority: 2,
      };

      const createRes = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      expect(createRes.statusCode).toBe(201);
      const taskId = createRes.body.task.id;

      // Verify otherUser cannot access testUser's project tasks
      const unauthorizedGetRes = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(unauthorizedGetRes.statusCode).toBe(403);
      expect(unauthorizedGetRes.body.message).toContain('not authorized');

      // Verify otherUser cannot update testUser's task
      const unauthorizedUpdateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hacked title' });

      expect(unauthorizedUpdateRes.statusCode).toBe(403);
      expect(unauthorizedUpdateRes.body.message).toContain('not authorized');

      // Verify unauthenticated requests are rejected
      const unauthenticatedRes = await request(app).get(
        `/api/projects/${testProject.id}/tasks`
      );

      expect(unauthenticatedRes.statusCode).toBe(401);
    });
  });

  describe('Error Propagation Integration', () => {
    it('should properly transform Sequelize validation errors to API responses', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create a task first
      const taskData = {
        title: 'Test Task',
        priority: 2,
      };

      const createRes = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(taskData);

      const taskId = createRes.body.task.id;

      // Trigger Sequelize validation error with invalid priority
      const invalidUpdateData = {
        priority: 5, // Invalid: outside range 1-3
      };

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidUpdateData);

      // Verify error is properly transformed by error middleware
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        'Priority must be 1 (Low), 2 (Medium), or 3 (High)'
      );
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
