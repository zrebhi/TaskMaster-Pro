const {
  createTask,
  getTasksForProject,
} = require("../controllers/taskController");
const { Task } = require("../models");

jest.mock("../models", () => ({
  Task: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe("Task Controller", () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      params: { projectId: "test-project-id" },
      body: {},
      user: { userId: "test-user-id" },
    };

    // mockReturnThis() enables method chaining by making the mock function return the response object itself,
    // which allows Express-style chaining like res.status(404).json({...}) to work properly in tests
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createTask", () => {
    it("should create task successfully with all fields", async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.body = { 
        title: '  Test Task  ', 
        description: 'Task description', 
        due_date: '2024-12-31', 
        priority: 3 
      };
      const mockTask = { 
        id: 'task-456', 
        project_id: 'project-123', 
        title: 'Test Task', 
        description: 'Task description', 
        due_date: '2024-12-31', 
        priority: 3 
      };
      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes);

      expect(Task.create).toHaveBeenCalledWith({ 
        project_id: 'project-123', 
        title: 'Test Task', 
        description: 'Task description', 
        due_date: '2024-12-31', 
        priority: 3 
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Task created successfully.", 
        task: mockTask 
      });
    });

    it("should create task with minimal required fields and defaults", async () => {
      mockReq.params.projectId = 'project-123';
      mockReq.body = { title: 'Minimal Task' };
      const mockTask = { 
        id: 'task-456', 
        project_id: 'project-123', 
        title: 'Minimal Task', 
        description: null, 
        due_date: null, 
        priority: 2 
      };
      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes);

      expect(Task.create).toHaveBeenCalledWith({ 
        project_id: 'project-123', 
        title: 'Minimal Task', 
        description: null, 
        due_date: null, 
        priority: 2 
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Task created successfully.", 
        task: mockTask 
      });
    });

    it("should return 400 when title is missing", async () => {
      mockReq.body = { description: 'No title provided' };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Task title is required." 
      });
      expect(Task.create).not.toHaveBeenCalled();
    });

    it("should return 400 when title is empty string", async () => {
      mockReq.body = { title: '' };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Task title is required." 
      });
      expect(Task.create).not.toHaveBeenCalled();
    });

    it("should return 400 when title is only whitespace", async () => {
      mockReq.body = { title: '   ' };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Task title is required." 
      });
      expect(Task.create).not.toHaveBeenCalled();
    });

    it("should handle Sequelize validation errors", async () => {
      mockReq.body = { title: 'Valid Title' };
      const validationError = { 
        name: 'SequelizeValidationError', 
        errors: [
          { message: 'Title too long' }, 
          { message: 'Invalid priority' }
        ] 
      };
      Task.create.mockRejectedValue(validationError);

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Title too long, Invalid priority" 
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Create task error:', validationError);
    });

    it("should handle general database errors", async () => {
      mockReq.body = { title: 'Valid Title' };
      const dbError = new Error("Database connection failed");
      Task.create.mockRejectedValue(dbError);

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Server error while creating task." 
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Create task error:', dbError);
    });

    it("should trim description when provided", async () => {
      mockReq.body = { title: 'Test Task', description: '  Task description  ' };
      const mockTask = { id: 'task-456', title: 'Test Task', description: 'Task description' };
      Task.create.mockResolvedValue(mockTask);

      await createTask(mockReq, mockRes);

      expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({ 
        description: 'Task description' 
      }));
    });

    it("should handle empty description as null", async () => {
      mockReq.body = { title: 'Test Task', description: '' };
      Task.create.mockResolvedValue({ id: 'task-456' });

      await createTask(mockReq, mockRes);

      expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({ 
        description: null 
      }));
    });
  });

  describe("getTasksForProject", () => {
    it("should fetch tasks successfully for project", async () => {
      mockReq.params.projectId = 'project-123';
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' }, 
        { id: 'task-2', title: 'Task 2' }
      ];
      Task.findAll.mockResolvedValue(mockTasks);

      await getTasksForProject(mockReq, mockRes);

      expect(Task.findAll).toHaveBeenCalledWith({ 
        where: { project_id: 'project-123' }, 
        order: [['createdAt', 'ASC']] 
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Tasks fetched successfully.", 
        count: 2, 
        tasks: mockTasks 
      });
    });

    it("should return empty array when no tasks exist", async () => {
      mockReq.params.projectId = 'project-123';
      Task.findAll.mockResolvedValue([]);

      await getTasksForProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Tasks fetched successfully.", 
        count: 0, 
        tasks: [] 
      });
    });

    it("should handle database errors during task fetch", async () => {
      mockReq.params.projectId = 'project-123';
      const dbError = new Error("Database connection failed");
      Task.findAll.mockRejectedValue(dbError);

      await getTasksForProject(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Server error while fetching tasks." 
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Get tasks for project error:', dbError);
    });
  });
});
