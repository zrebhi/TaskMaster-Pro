import { renderHook, act } from '@testing-library/react';
import { useContext } from 'react';
import TaskContext, { TaskProvider } from '@/context/TaskContext';
import {
  createMockErrorContext,
  createAuthenticatedContext,
  createUnauthenticatedContext,
} from '@/__tests__/helpers/mock-providers';
import { createMockTask, createMockApiError } from '@/__tests__/helpers/test-utils';

jest.mock('@/services/taskApiService', () => ({
  getTasksForProjectAPI: jest.fn(),
  createTaskInProjectAPI: jest.fn(),
  updateTaskDetails: jest.fn(),
  deleteTaskById: jest.fn(),
}));

jest.mock('@/context/ErrorContext', () => ({
  useError: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.createContext(null),
  };
});

const {
  getTasksForProjectAPI,
  createTaskInProjectAPI,
  updateTaskDetails,
  deleteTaskById,
} = require('@/services/taskApiService');
const { useError } = require('@/context/ErrorContext');

describe('TaskContext', () => {
  let mockErrorContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorContext = createMockErrorContext();
    useError.mockReturnValue(mockErrorContext);
  });

  const createWrapper = (authContextValue = createAuthenticatedContext()) => {
    return ({ children }) => {
      const AuthContext = require('@/context/AuthContext').default;

      return (
        <AuthContext.Provider value={authContextValue}>
          <TaskProvider>{children}</TaskProvider>
        </AuthContext.Provider>
      );
    };
  };

  const renderTaskContext = (
    authContextValue = createAuthenticatedContext()
  ) => {
    const wrapper = createWrapper(authContextValue);
    return renderHook(() => useContext(TaskContext), { wrapper });
  };

  describe('Provider State Management', () => {
    test('initializes with empty state', () => {
      const { result } = renderTaskContext();

      expect(result.current.tasks).toEqual([]);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
      expect(result.current.currentProjectIdForTasks).toBeNull();
      expect(typeof result.current.fetchTasks).toBe('function');
      expect(typeof result.current.addTask).toBe('function');
      expect(typeof result.current.updateTask).toBe('function');
      expect(typeof result.current.deleteTask).toBe('function');
      expect(typeof result.current.clearTasks).toBe('function');
    });
  });

  describe('fetchTasks Function', () => {
    test('successfully fetches tasks for valid projectId', async () => {
      const projectId = 'project-123';
      const mockTasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];
      getTasksForProjectAPI.mockResolvedValue(mockTasks);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test.each([
      ['empty string', ''],
      ['null', null],
      ['undefined', undefined],
    ])('clears tasks when projectId is %s', async (_, projectId) => {
      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).not.toHaveBeenCalled();
      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBeNull();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
    });

    test('does not call API when unauthenticated', async () => {
      const projectId = 'project-123';
      const { result } = renderTaskContext(createUnauthenticatedContext());

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).not.toHaveBeenCalled();
      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBeNull();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
    });

    test.each([
      [
        'with processedError',
        createMockApiError(404, 'Tasks not found', 'medium'),
        'Tasks not found',
      ],
      [
        'without processedError',
        new Error('Raw API error'),
        'Failed to fetch tasks for the project.',
      ],
    ])('handles API error %s', async (_, apiError, expectedTaskError) => {
      const projectId = 'project-123';
      getTasksForProjectAPI.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBe(expectedTaskError);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith(
        apiError.processedError || {
          message: 'Failed to fetch tasks for the project.',
          severity: 'medium',
        }
      );
    });

    test('manages loading state correctly during fetch', async () => {
      const projectId = 'project-123';
      const mockTasks = [createMockTask()];

      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      getTasksForProjectAPI.mockReturnValue(promise);

      const { result } = renderTaskContext();

      act(() => {
        result.current.fetchTasks(projectId);
      });

      expect(result.current.isLoadingTasks).toBe(true);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);
      expect(result.current.taskError).toBeNull();

      await act(async () => {
        resolvePromise(mockTasks);
        await promise;
      });

      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.tasks).toEqual(mockTasks);
    });
  });

  describe('clearTasks Function', () => {
    test('clears all task-related state', async () => {
      const projectId = 'project-123';
      const mockTasks = [createMockTask()];
      getTasksForProjectAPI.mockResolvedValue(mockTasks);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);

      act(() => {
        result.current.clearTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBeNull();
      expect(result.current.taskError).toBeNull();
      expect(result.current.isLoadingTasks).toBe(false);
    });

    test('clears error state when called', async () => {
      const projectId = 'project-123';
      const apiError = createMockApiError(500, 'Server error', 'high');
      getTasksForProjectAPI.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(result.current.taskError).toBe('Server error');

      act(() => {
        result.current.clearTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBeNull();
      expect(result.current.taskError).toBeNull();
    });
  });

  describe('addTask Function', () => {
    test('successfully creates task and updates state optimistically', async () => {
      const projectId = 'project-123';
      const taskData = { title: 'New Task', description: 'Task description' };
      const newTask = createMockTask({
        id: 'task-new',
        title: 'New Task',
        description: 'Task description',
        projectId,
      });

      // Reset mocks to ensure clean state
      getTasksForProjectAPI.mockResolvedValue([]);
      createTaskInProjectAPI.mockResolvedValue(newTask);

      const { result } = renderTaskContext();

      // Set up initial state with current project
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      const initialTaskCount = result.current.tasks.length;

      await act(async () => {
        await result.current.addTask(projectId, taskData);
      });

      expect(createTaskInProjectAPI).toHaveBeenCalledWith(projectId, taskData);
      expect(result.current.tasks).toHaveLength(initialTaskCount + 1);
      expect(result.current.tasks).toContainEqual(newTask);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test.each([
      ['empty projectId', '', { title: 'Task' }],
      ['null projectId', null, { title: 'Task' }],
      ['undefined projectId', undefined, { title: 'Task' }],
      ['empty taskData', 'project-123', ''],
      ['null taskData', 'project-123', null],
      ['undefined taskData', 'project-123', undefined],
    ])('does not call API when %s', async (_, projectId, taskData) => {
      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.addTask(projectId, taskData);
      });

      expect(createTaskInProjectAPI).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test('shows error and does not call API when unauthenticated', async () => {
      const projectId = 'project-123';
      const taskData = { title: 'New Task' };
      const { result } = renderTaskContext(createUnauthenticatedContext());

      await act(async () => {
        await result.current.addTask(projectId, taskData);
      });

      expect(createTaskInProjectAPI).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith({
        message: 'Authentication required to create tasks.',
        severity: 'medium',
      });
    });

    test.each([
      [
        'with processedError',
        createMockApiError(400, 'Task creation failed', 'medium'),
      ],
      ['without processedError', new Error('Raw API error')],
    ])('handles API error %s', async (_, apiError) => {
      const projectId = 'project-123';
      const taskData = { title: 'New Task' };
      createTaskInProjectAPI.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      // Test that the function throws the error
      await expect(
        act(async () => {
          await result.current.addTask(projectId, taskData);
        })
      ).rejects.toThrow(apiError);

      // Test that the API was called
      expect(createTaskInProjectAPI).toHaveBeenCalledWith(projectId, taskData);

      // Test that error toast was called
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith(
        apiError.processedError || {
          message: 'Failed to create task. Please try again.',
          severity: 'medium',
        }
      );

      // Test loading state is reset
      expect(result.current.isLoadingTasks).toBe(false);
    });

    test('only updates tasks if current project matches', async () => {
      const currentProjectId = 'project-123';
      const differentProjectId = 'project-456';
      const taskData = { title: 'New Task' };
      const newTask = createMockTask({
        id: 'task-new',
        projectId: differentProjectId,
      });

      createTaskInProjectAPI.mockResolvedValue(newTask);

      const { result } = renderTaskContext();

      // Set up initial state with current project
      await act(async () => {
        await result.current.fetchTasks(currentProjectId);
      });

      const initialTaskCount = result.current.tasks.length;

      // Add task to different project
      await act(async () => {
        await result.current.addTask(differentProjectId, taskData);
      });

      expect(createTaskInProjectAPI).toHaveBeenCalledWith(
        differentProjectId,
        taskData
      );
      expect(result.current.tasks).toHaveLength(initialTaskCount); // No change
      expect(result.current.tasks).not.toContainEqual(newTask);
      expect(result.current.currentProjectIdForTasks).toBe(currentProjectId);
    });

  });

  describe('updateTask Function', () => {
    test('successfully updates task and updates state', async () => {
      const projectId = 'project-123';
      const taskId = 'task-123';
      const taskData = {
        title: 'Updated Task',
        description: 'Updated description',
      };
      const existingTask = createMockTask({
        id: taskId,
        title: 'Original Task',
        projectId,
      });
      const updatedTask = createMockTask({
        id: taskId,
        title: 'Updated Task',
        description: 'Updated description',
        projectId,
      });

      // Set up mocks
      getTasksForProjectAPI.mockResolvedValue([existingTask]);
      updateTaskDetails.mockResolvedValue(updatedTask);

      const { result } = renderTaskContext();

      // Set up initial state with existing task
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].title).toBe('Original Task');

      await act(async () => {
        await result.current.updateTask(taskId, taskData);
      });

      expect(updateTaskDetails).toHaveBeenCalledWith(taskId, taskData);
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toEqual(
        expect.objectContaining({
          id: taskId,
          title: 'Updated Task',
          description: 'Updated description',
        })
      );
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test.each([
      ['empty taskId', '', { title: 'Updated Task' }],
      ['null taskId', null, { title: 'Updated Task' }],
      ['undefined taskId', undefined, { title: 'Updated Task' }],
      ['empty taskData', 'task-123', ''],
      ['null taskData', 'task-123', null],
      ['undefined taskData', 'task-123', undefined],
    ])('does not call API when %s', async (_, taskId, taskData) => {
      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.updateTask(taskId, taskData);
      });

      expect(updateTaskDetails).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test('shows error and does not call API when unauthenticated', async () => {
      const taskId = 'task-123';
      const taskData = { title: 'Updated Task' };
      const { result } = renderTaskContext(createUnauthenticatedContext());

      await act(async () => {
        await result.current.updateTask(taskId, taskData);
      });

      expect(updateTaskDetails).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith({
        message: 'Authentication required to update tasks.',
        severity: 'medium',
      });
    });

    test.each([
      [
        'with processedError',
        createMockApiError(400, 'Task update failed', 'medium'),
      ],
      ['without processedError', new Error('Raw API error')],
    ])('handles API error %s', async (_, apiError) => {
      const projectId = 'project-123';
      const taskId = 'task-123';
      const taskData = { title: 'Updated Task' };
      const existingTask = createMockTask({ id: taskId, projectId });

      getTasksForProjectAPI.mockResolvedValue([existingTask]);
      updateTaskDetails.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      // Set up initial state
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      // Test that the function throws the error
      await expect(
        act(async () => {
          await result.current.updateTask(taskId, taskData);
        })
      ).rejects.toThrow(apiError);

      expect(updateTaskDetails).toHaveBeenCalledWith(taskId, taskData);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith(
        apiError.processedError || {
          message: 'Failed to update task. Please try again.',
          severity: 'medium',
        }
      );
      expect(result.current.isLoadingTasks).toBe(false);
    });

    test('updates only the matching task and leaves others unchanged', async () => {
      const projectId = 'project-123';
      const taskId = 'task-123';
      const otherTaskId = 'task-456';
      const taskData = { title: 'Updated Task' };

      const existingTasks = [
        createMockTask({ id: taskId, title: 'Original Task', projectId }),
        createMockTask({ id: otherTaskId, title: 'Other Task', projectId }),
      ];
      const updatedTask = createMockTask({
        id: taskId,
        title: 'Updated Task',
        projectId,
      });

      getTasksForProjectAPI.mockResolvedValue(existingTasks);
      updateTaskDetails.mockResolvedValue(updatedTask);

      const { result } = renderTaskContext();

      // Set up initial state with existing tasks
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(result.current.tasks).toHaveLength(2);

      await act(async () => {
        await result.current.updateTask(taskId, taskData);
      });

      expect(result.current.tasks).toHaveLength(2);
      expect(result.current.tasks.find((t) => t.id === taskId).title).toBe(
        'Updated Task'
      );
      expect(result.current.tasks.find((t) => t.id === otherTaskId).title).toBe(
        'Other Task'
      );
    });
  });

  describe('deleteTask Function', () => {
    test('successfully deletes task and removes from state', async () => {
      const projectId = 'project-123';
      const taskId = 'task-123';
      const existingTask = createMockTask({ id: taskId, projectId });

      // Set up mocks
      getTasksForProjectAPI.mockResolvedValue([existingTask]);
      deleteTaskById.mockResolvedValue({
        message: 'Task deleted successfully',
      });

      const { result } = renderTaskContext();

      // Set up initial state with existing task
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(result.current.tasks).toHaveLength(1);

      await act(async () => {
        await result.current.deleteTask(taskId);
      });

      expect(deleteTaskById).toHaveBeenCalledWith(taskId);
      expect(result.current.tasks).toHaveLength(0);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBeNull();
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test.each([
      ['empty taskId', ''],
      ['null taskId', null],
      ['undefined taskId', undefined],
    ])('does not call API when %s', async (_, taskId) => {
      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.deleteTask(taskId);
      });

      expect(deleteTaskById).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).not.toHaveBeenCalled();
    });

    test('shows error and does not call API when unauthenticated', async () => {
      const taskId = 'task-123';
      const { result } = renderTaskContext(createUnauthenticatedContext());

      await act(async () => {
        await result.current.deleteTask(taskId);
      });

      expect(deleteTaskById).not.toHaveBeenCalled();
      expect(result.current.isLoadingTasks).toBe(false);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith({
        message: 'Authentication required to delete tasks.',
        severity: 'medium',
      });
    });

    test.each([
      [
        'with processedError',
        createMockApiError(404, 'Task not found', 'medium'),
      ],
      ['without processedError', new Error('Raw API error')],
    ])('handles API error %s', async (_, apiError) => {
      const projectId = 'project-123';
      const taskId = 'task-123';
      const existingTask = createMockTask({ id: taskId, projectId });

      getTasksForProjectAPI.mockResolvedValue([existingTask]);
      deleteTaskById.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      // Set up initial state
      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      // Test that the function throws the error
      await expect(
        act(async () => {
          await result.current.deleteTask(taskId);
        })
      ).rejects.toThrow(apiError);

      expect(deleteTaskById).toHaveBeenCalledWith(taskId);
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith(
        apiError.processedError || {
          message: 'Failed to delete task. Please try again.',
          severity: 'medium',
        }
      );
      expect(result.current.isLoadingTasks).toBe(false);
    });
  });
});
