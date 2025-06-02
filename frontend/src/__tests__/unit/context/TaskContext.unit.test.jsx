import { renderHook, act } from '@testing-library/react';
import { useContext } from 'react';
import TaskContext, { TaskProvider } from '../../../context/TaskContext';
import {
  createMockErrorContext,
  createAuthenticatedContext,
  createUnauthenticatedContext,
} from '../../helpers/mock-providers';
import { createMockTask, createMockApiError } from '../../helpers/test-utils';

jest.mock('../../../services/taskApiService', () => ({
  getTasksForProjectAPI: jest.fn(),
}));

jest.mock('../../../context/ErrorContext', () => ({
  useError: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.createContext(null),
  };
});

const { getTasksForProjectAPI } = require('../../../services/taskApiService');
const { useError } = require('../../../context/ErrorContext');

describe('TaskContext', () => {
  let mockErrorContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorContext = createMockErrorContext();
    useError.mockReturnValue(mockErrorContext);
  });

  const createWrapper = (authContextValue = createAuthenticatedContext()) => {
    return ({ children }) => {
      const AuthContext = require('../../../context/AuthContext').default;

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

    test('handles API error with processedError', async () => {
      const projectId = 'project-123';
      const apiError = createMockApiError(404, 'Tasks not found', 'medium');
      getTasksForProjectAPI.mockRejectedValue(apiError);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBe('Tasks not found');
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith(
        apiError.processedError
      );
    });

    test('handles API error without processedError', async () => {
      const projectId = 'project-123';
      const rawError = new Error('Raw API error');
      getTasksForProjectAPI.mockRejectedValue(rawError);

      const { result } = renderTaskContext();

      await act(async () => {
        await result.current.fetchTasks(projectId);
      });

      expect(getTasksForProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.currentProjectIdForTasks).toBe(projectId);
      expect(result.current.isLoadingTasks).toBe(false);
      expect(result.current.taskError).toBe(
        'Failed to fetch tasks for the project.'
      );
      expect(mockErrorContext.showErrorToast).toHaveBeenCalledWith({
        message: 'Failed to fetch tasks for the project.',
        severity: 'medium',
      });
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

  describe('Placeholder Functions', () => {
    test('all placeholder functions exist and are callable', async () => {
      const { result } = renderTaskContext();

      expect(typeof result.current.addTask).toBe('function');
      expect(typeof result.current.updateTask).toBe('function');
      expect(typeof result.current.deleteTask).toBe('function');

      await act(async () => {
        await result.current.addTask('project-123', { title: 'New Task' });
        await result.current.updateTask('task-123', { title: 'Updated Task' });
        await result.current.deleteTask('task-123');
      });
    });
  });
});
