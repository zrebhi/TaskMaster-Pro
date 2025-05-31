const {
  verifyProjectOwnership,
} = require('../middleware/projectAuthMiddleware');
const { Project } = require('../models');

jest.mock('../models', () => ({
  Project: {
    findByPk: jest.fn(),
  },
}));

describe('Project Authorization Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: { projectId: 'test-project-id' },
      user: { userId: 'test-user-id' },
      project: null,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(), // mockReturnThis() enables method chaining by making the mock function return the response object itself,
      json: jest.fn().mockReturnThis(), // which allows Express-style chaining like res.status(404).json({...}) to work properly in tests
    };

    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyProjectOwnership', () => {
    it('should allow access when user owns the project', async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.user.userId = 'user-456';
      const mockProject = {
        id: 'project-123',
        user_id: 'user-456',
        name: 'Test Project',
      };
      Project.findByPk.mockResolvedValue(mockProject);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.project).toBe(mockProject);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is missing from req.user', async () => {
      mockReq.user = {};

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(Project.findByPk).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is null', async () => {
      mockReq.user.userId = null;

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(Project.findByPk).not.toHaveBeenCalled();
    });

    it('should return 400 when projectId is missing from params', async () => {
      mockReq.params = {};
      mockReq.user.userId = 'valid-user-id';

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project ID is required in parameters.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when projectId is null', async () => {
      mockReq.params.projectId = null;
      mockReq.user.userId = 'valid-user-id';

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project ID is required in parameters.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 404 when project doesn't exist", async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.user.userId = 'user-456';
      Project.findByPk.mockResolvedValue(null);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project not found.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 when user doesn't own the project", async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.user.userId = 'user-456';
      const mockProject = {
        id: 'project-123',
        user_id: 'different-user',
        name: 'Test Project',
      };
      Project.findByPk.mockResolvedValue(mockProject);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          "User not authorized to access or modify this project's resources.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.user.userId = 'user-456';
      const dbError = new Error('Database connection failed');
      Project.findByPk.mockRejectedValue(dbError);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error during project authorization.',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Project authorization error:',
        dbError
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
