import * as taskApiService from '../../../services/taskApiService';
import { taskApiMocks } from '../../helpers/api-mocks';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('taskApiService Unit Tests', () => {
  let mockApi;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = require('../../../services/apiClient').api;
  });

  describe('getTasksForProjectAPI', () => {
    const projectId = 'project-123';

    test('returns tasks array on successful response', async () => {
      const tasksResponse = taskApiMocks.getAllSuccess();
      mockApi.get.mockResolvedValue({ data: tasksResponse });

      const result = await taskApiService.getTasksForProjectAPI(projectId);

      expect(mockApi.get).toHaveBeenCalledWith(
        `/projects/${projectId}/tasks`,
        'fetching tasks'
      );
      expect(result).toEqual(tasksResponse.tasks);
    });

    test('returns empty array when no tasks wrapper', async () => {
      mockApi.get.mockResolvedValue({ data: {} });

      const result = await taskApiService.getTasksForProjectAPI(projectId);

      expect(mockApi.get).toHaveBeenCalledWith(
        `/projects/${projectId}/tasks`,
        'fetching tasks'
      );
      expect(result).toEqual([]);
    });
  });

  describe('createTaskInProjectAPI', () => {
    const projectId = 'project-123';
    const taskData = { title: 'New Task', description: 'Task description' };

    test('returns created task on successful response', async () => {
      const createResponse = taskApiMocks.createSuccess({
        title: 'New Task',
        description: 'Task description',
      });
      mockApi.post.mockResolvedValue({ data: createResponse });

      const result = await taskApiService.createTaskInProjectAPI(
        projectId,
        taskData
      );

      expect(mockApi.post).toHaveBeenCalledWith(
        `/projects/${projectId}/tasks`,
        taskData,
        'creating task'
      );
      expect(result).toEqual(createResponse.task);
    });

    test('returns data directly when no task wrapper', async () => {
      const createdTask = taskApiMocks.createSuccess({
        title: 'New Task',
        description: 'Task description',
      }).task;
      mockApi.post.mockResolvedValue({ data: createdTask });

      const result = await taskApiService.createTaskInProjectAPI(
        projectId,
        taskData
      );

      expect(mockApi.post).toHaveBeenCalledWith(
        `/projects/${projectId}/tasks`,
        taskData,
        'creating task'
      );
      expect(result).toEqual(createdTask);
    });
  });

  describe('updateTaskDetails', () => {
    const taskId = 'task-123';
    const taskData = { title: 'Updated Task', priority: 'high' };

    test('returns updated task on successful response', async () => {
      const updateResponse = taskApiMocks.updateSuccess(taskId, {
        title: 'Updated Task',
        priority: 'high',
      });
      mockApi.put.mockResolvedValue({ data: updateResponse });

      const result = await taskApiService.updateTaskDetails(taskId, taskData);

      expect(mockApi.put).toHaveBeenCalledWith(
        `/tasks/${taskId}`,
        taskData,
        'updating task'
      );
      expect(result).toEqual(updateResponse.task);
    });

    test('returns data directly when no task wrapper', async () => {
      const updatedTask = taskApiMocks.updateSuccess(taskId, {
        title: 'Updated Task',
        priority: 'high',
      }).task;
      mockApi.put.mockResolvedValue({ data: updatedTask });

      const result = await taskApiService.updateTaskDetails(taskId, taskData);

      expect(mockApi.put).toHaveBeenCalledWith(
        `/tasks/${taskId}`,
        taskData,
        'updating task'
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('deleteTaskById', () => {
    const taskId = 'task-123';

    test('returns delete response on successful deletion', async () => {
      const deleteResponse = taskApiMocks.deleteSuccess();
      mockApi.delete.mockResolvedValue({ data: deleteResponse });

      const result = await taskApiService.deleteTaskById(taskId);

      expect(mockApi.delete).toHaveBeenCalledWith(
        `/tasks/${taskId}`,
        'deleting task'
      );
      expect(result).toEqual(deleteResponse);
    });
  });
});
