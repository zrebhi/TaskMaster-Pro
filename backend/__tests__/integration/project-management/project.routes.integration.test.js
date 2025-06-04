const request = require('supertest');
const app = require('../../../server');
const { User, Project } = require('../../../models');
const { v4: uuidv4 } = require('uuid');
const databaseTestHelper = require('../../helpers/database');
const { createUser } = require('../../helpers/testDataFactory');

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
  });

  describe('GET /api/projects - Get all projects for the authenticated user', () => {
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

  describe('DELETE /api/projects/:projectId - Delete a project', () => {
    let projectToDelete;

    beforeEach(async () => {
      projectToDelete = await Project.create({
        name: 'Project to Delete',
        user_id: testUser.id,
      });
      jest.clearAllMocks();
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
});
