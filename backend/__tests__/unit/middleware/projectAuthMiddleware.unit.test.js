const {
  verifyProjectOwnership,
} = require('../../../middleware/projectAuthMiddleware');
const { Project } = require('../../../models');
const {
  createMockProject,
  createMockReqResNext,
} = require('../../helpers/unitTestHelpers');

jest.mock('../../../models', () => ({
  Project: {
    findByPk: jest.fn(),
  },
}));

describe('Project Authorization Middleware Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  const expectErrorCall = (message, statusCode, errorCode) => {
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        statusCode,
        errorCode,
      })
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ({ mockReq, mockRes, mockNext } = createMockReqResNext({
      params: { projectId: 'project-123' },
      user: { userId: 'user-123' },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyProjectOwnership', () => {
    it('should allow access when user owns the project', async () => {
      const mockProject = createMockProject({
        id: 'project-123',
        user_id: 'user-123',
      });
      Project.findByPk.mockResolvedValue(mockProject);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.project).toBe(mockProject);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it.each([
      ['missing from req.user', {}],
      ['null', { userId: null }],
    ])(
      'should throw AuthenticationError when userId is %s',
      async (_, userOverride) => {
        mockReq.user = userOverride;

        await verifyProjectOwnership(mockReq, mockRes, mockNext);

        expectErrorCall(
          'Authentication required.',
          401,
          'AUTHENTICATION_ERROR'
        );
        expect(Project.findByPk).not.toHaveBeenCalled();
      }
    );

    it.each([
      ['missing from params', {}],
      ['null', { projectId: null }],
    ])(
      'should throw ValidationError when projectId is %s',
      async (_, paramsOverride) => {
        mockReq.params = paramsOverride;

        await verifyProjectOwnership(mockReq, mockRes, mockNext);

        expectErrorCall(
          'Project ID is required in parameters.',
          400,
          'VALIDATION_ERROR'
        );
        expect(Project.findByPk).not.toHaveBeenCalled();
      }
    );

    it("should throw NotFoundError when project doesn't exist", async () => {
      Project.findByPk.mockResolvedValue(null);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expectErrorCall('Project not found', 404, 'NOT_FOUND_ERROR');
    });

    it("should throw AuthorizationError when user doesn't own the project", async () => {
      mockReq.user.userId = 'different-user';
      const mockProject = createMockProject({
        id: 'project-123',
        user_id: 'original-owner',
      });
      Project.findByPk.mockResolvedValue(mockProject);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expectErrorCall(
        "User not authorized to access or modify this project's resources.",
        403,
        'AUTHORIZATION_ERROR'
      );
    });

    it('should pass database errors to next middleware', async () => {
      const dbError = new Error('Database connection failed');
      Project.findByPk.mockRejectedValue(dbError);

      await verifyProjectOwnership(mockReq, mockRes, mockNext);

      expect(Project.findByPk).toHaveBeenCalledWith('project-123');
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
