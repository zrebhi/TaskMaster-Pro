const {
  createProject,
  getProjects,
  updateProject,
} = require('../controllers/projectController');
const { Project } = require('../models');

jest.mock('../models', () => ({
  Project: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('Project Controller', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      user: { userId: 'test-user-id' },
      project: null,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createProject', () => {
    it('should handle Sequelize validation errors during project creation', async () => {
      // Arrange
      mockReq.body = { name: 'Valid Project Name' };
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Name must be unique' },
          { message: 'Name too long' },
        ],
      };
      Project.create.mockRejectedValue(validationError);

      // Act
      await createProject(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Name must be unique Name too long',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Create project error:',
        validationError
      );
    });

    it('should handle general database errors during project creation', async () => {
      // Arrange
      mockReq.body = { name: 'Valid Project Name' };
      const dbError = new Error('Database connection failed');
      Project.create.mockRejectedValue(dbError);

      // Act
      await createProject(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error while creating project.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Create project error:',
        dbError
      );
    });
  });

  describe('getProjects', () => {
    it('should handle database errors during project fetch', async () => {
      // Arrange
      const dbError = new Error('Database connection timeout');
      Project.findAll.mockRejectedValue(dbError);

      // Act
      await getProjects(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error while fetching projects.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Get projects error:',
        dbError
      );
    });
  });

  describe('updateProject', () => {
    it('should handle Sequelize validation errors during project update', async () => {
      // Arrange
      mockReq.body = { name: 'Updated Project Name' };
      const mockProject = {
        name: 'Old Name',
        save: jest.fn(),
      };
      mockReq.project = mockProject;
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [{ message: 'Name already exists' }],
      };
      mockProject.save.mockRejectedValue(validationError);

      // Act
      await updateProject(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Name already exists',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Update project error:',
        validationError
      );
    });

    it('should handle general database errors during project update', async () => {
      // Arrange
      mockReq.body = { name: 'Updated Project Name' };
      const mockProject = {
        name: 'Old Name',
        save: jest.fn(),
      };
      mockReq.project = mockProject;
      const dbError = new Error('Database write failed');
      mockProject.save.mockRejectedValue(dbError);

      // Act
      await updateProject(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error while updating project.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Update project error:',
        dbError
      );
    });
  });
});
