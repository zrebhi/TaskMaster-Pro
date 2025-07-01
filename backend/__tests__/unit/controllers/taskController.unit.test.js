const {
  createTask,
  getTasksForProject,
  updateTask,
  deleteTask,
} = require('../../../controllers/taskController');
const { Task, Project } = require('../../../models');
const {
  createMockTask,
  createMockReqResNext,
} = require('../../helpers/unitTestHelpers');

jest.mock('../../../models', () => ({
  Task: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Project: {},
}));

jest.mock('../../../utils/customErrors', () => {
  const actual = jest.requireActual('../../../utils/customErrors');
  return {
    ...actual,
    asyncHandler: (fn) => fn,
  };
});

describe('Task Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ mockReq, mockRes, mockNext } = createMockReqResNext({
      params: { projectId: 'project-123' },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTask', () => {
    it('should call Task.create with trimmed title and default priority', async () => {
      mockReq.body = { title: '  A Task with extra spaces  ' };
      const mockTask = createMockTask({ title: 'A Task with extra spaces' });
      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes, mockNext);

      expect(Task.create).toHaveBeenCalledWith({
        project_id: 'project-123',
        title: 'A Task with extra spaces', // Title is trimmed
        description: null,
        due_date: null,
        priority: 2, // Default priority
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ task: mockTask })
      );
    });

    it('should throw a ValidationError if title is missing', async () => {
      mockReq.body = { description: 'A task without a title' };

      await expect(createTask(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Task title is required.',
          statusCode: 400,
        })
      );
    });

    it('should throw a ValidationError if title is only whitespace', async () => {
      mockReq.body = { title: '   ' }; // Whitespace only

      await expect(createTask(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Task title is required.',
          statusCode: 400,
        })
      );
    });
  });

  describe('getTasksForProject', () => {
    it('should successfully fetch all tasks for a project', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];

      Task.findAll.mockResolvedValue(mockTasks);

      await getTasksForProject(mockReq, mockRes, mockNext);

      expect(Task.findAll).toHaveBeenCalledWith({
        where: { project_id: 'project-123' },
        order: [['createdAt', 'ASC']],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Tasks fetched successfully.',
        count: 2,
        tasks: mockTasks,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

});
