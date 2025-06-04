const {
  createTask,
  getTasksForProject,
  updateTask,
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
    it('should successfully create a new task', async () => {
      mockReq.body = {
        title: 'New Task',
        description: 'Task description',
        due_date: '2024-12-31',
        priority: 3,
      };
      const mockTask = createMockTask();

      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes, mockNext);

      expect(Task.create).toHaveBeenCalledWith({
        project_id: 'project-123',
        title: 'New Task',
        description: 'Task description',
        due_date: '2024-12-31',
        priority: 3,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task created successfully.',
        task: mockTask,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should create task with default values when optional fields are missing', async () => {
      mockReq.body = { title: 'Minimal Task' };
      const mockTask = createMockTask();

      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes, mockNext);

      expect(Task.create).toHaveBeenCalledWith({
        project_id: 'project-123',
        title: 'Minimal Task',
        description: null,
        due_date: null,
        priority: 2,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should throw ValidationError when title is missing', async () => {
      mockReq.body = { description: 'Task without title' };

      await expect(createTask(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'Task title is required.',
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
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

  describe('updateTask', () => {
    beforeEach(() => {
      mockReq.params = { taskId: 'task-123' };
    });

    it('should successfully update a task', async () => {
      mockReq.body = {
        title: 'Updated Task',
        description: 'Updated description',
        due_date: '2025-01-01',
        priority: 3,
        is_completed: true,
      };
      const mockTask = createMockTask();

      Task.findByPk.mockResolvedValue(mockTask);

      await updateTask(mockReq, mockRes, mockNext);

      expect(Task.findByPk).toHaveBeenCalledWith('task-123', {
        include: [{ model: Project, as: 'Project' }],
      });
      expect(mockTask.title).toBe('Updated Task');
      expect(mockTask.description).toBe('Updated description');
      expect(mockTask.due_date).toBe('2025-01-01');
      expect(mockTask.priority).toBe(3);
      expect(mockTask.is_completed).toBe(true);
      expect(mockTask.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task updated successfully.',
        task: mockTask,
      });
    });

    it('should throw NotFoundError when task does not exist', async () => {
      Task.findByPk.mockResolvedValue(null);

      await expect(updateTask(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'Task not found',
          statusCode: 404,
          errorCode: 'NOT_FOUND_ERROR',
        })
      );
    });

    it('should throw AuthorizationError when user does not own the project', async () => {
      const mockTask = createMockTask({
        Project: { user_id: 'different-user-123' },
      });

      Task.findByPk.mockResolvedValue(mockTask);

      await expect(updateTask(mockReq, mockRes, mockNext)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not authorized to update this task.',
          statusCode: 403,
          errorCode: 'AUTHORIZATION_ERROR',
        })
      );
    });

    it('should handle description set to null', async () => {
      mockReq.body = { description: null };
      const mockTask = createMockTask();

      Task.findByPk.mockResolvedValue(mockTask);

      await updateTask(mockReq, mockRes, mockNext);

      expect(mockTask.description).toBe(null);
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('should handle non-string title value', async () => {
      mockReq.body = { title: 123 };
      const mockTask = createMockTask();

      Task.findByPk.mockResolvedValue(mockTask);

      await updateTask(mockReq, mockRes, mockNext);

      expect(mockTask.title).toBe(123);
      expect(mockTask.save).toHaveBeenCalled();
    });
  });
});
