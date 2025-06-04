const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require('../../../controllers/projectController');
const { Project } = require('../../../models');
const {
  createMockProject,
  createMockReqResNext,
} = require('../../helpers/unitTestHelpers');

jest.mock('../../../models', () => ({
  Project: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../../utils/customErrors', () => {
  const actual = jest.requireActual('../../../utils/customErrors');
  return {
    ...actual,
    asyncHandler: (fn) => fn,
  };
});

describe('Project Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ mockReq, mockRes, mockNext } = createMockReqResNext());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const testProjectNameValidation = (controllerFn, setupFn = () => {}) => {
    describe('project name validation', () => {
      it('should throw ValidationError when name is missing', async () => {
        mockReq.body = {};
        setupFn();

        await expect(controllerFn(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Project name is required.',
            statusCode: 400,
            errorCode: 'VALIDATION_ERROR',
          })
        );
      });

      it('should throw ValidationError when name is too long', async () => {
        mockReq.body = { name: 'a'.repeat(256) };
        setupFn();

        await expect(controllerFn(mockReq, mockRes, mockNext)).rejects.toThrow(
          expect.objectContaining({
            message: 'Project name is too long.',
            statusCode: 400,
            errorCode: 'VALIDATION_ERROR',
          })
        );
      });
    });
  };

  describe('createProject', () => {
    it('should successfully create a new project', async () => {
      mockReq.body = { name: 'Test Project' };
      const mockProject = createMockProject();

      Project.create.mockResolvedValue(mockProject);

      await createProject(mockReq, mockRes, mockNext);

      expect(Project.create).toHaveBeenCalledWith({
        name: 'Test Project',
        user_id: 'user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project created successfully.',
        project: mockProject,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    testProjectNameValidation(createProject);
  });

  describe('getProjects', () => {
    it('should successfully fetch all projects for authenticated user', async () => {
      const mockProjects = [
        createMockProject({ id: 'project-1', name: 'Project 1' }),
        createMockProject({ id: 'project-2', name: 'Project 2' }),
      ];

      Project.findAll.mockResolvedValue(mockProjects);

      await getProjects(mockReq, mockRes, mockNext);

      expect(Project.findAll).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        order: [['createdAt', 'DESC']],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Projects fetched successfully.',
        count: 2,
        projects: mockProjects,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      mockReq.project = createMockProject();
    });

    it('should successfully update project name', async () => {
      mockReq.body = { name: 'Updated Project Name' };

      await updateProject(mockReq, mockRes, mockNext);

      expect(mockReq.project.name).toBe('Updated Project Name');
      expect(mockReq.project.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project updated successfully.',
        project: mockReq.project,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    testProjectNameValidation(updateProject, () => {
      mockReq.project = createMockProject();
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      mockReq.project = createMockProject();
    });

    it('should successfully delete a project', async () => {
      await deleteProject(mockReq, mockRes, mockNext);

      expect(mockReq.project.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project and associated tasks deleted successfully.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
