import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasksForProjectAPI,
  createTaskInProjectAPI,
  updateTaskAPI,
  deleteTaskAPI,
  patchTaskAPI,
} from '@/services/taskApiService';
import { useError } from '@/context/ErrorContext';
import { handleApiError } from '@/utils/errorHandler';

export const useTasks = (projectId) => {
  const { showErrorToast } = useError();

  const queryResult = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getTasksForProjectAPI(projectId),
    enabled: !!projectId, // Only fetch when projectId is provided
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle query errors
  if (queryResult.error) {
    const processedError = handleApiError(
      queryResult.error,
      'fetching tasks'
    );
    showErrorToast(processedError);
  }

  return queryResult;
};

/**
 * A collection of custom hooks for task mutations
 */

export const useAddTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: ({ projectId, taskData }) => createTaskInProjectAPI(projectId, taskData),
    onSuccess: (newTask, variables) => {
      // Update the tasks cache for the specific project
      queryClient.setQueryData(['tasks', variables.projectId], (oldData) => {
        const oldTasks = oldData || [];
        return [...oldTasks, newTask];
      });
      
      // Optionally invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      
      showSuccess('Task created successfully!');
      
      if (onMutationSuccess) {
        onMutationSuccess(newTask);
      }
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      showErrorToast(handleApiError(error, 'creating the task'));
      
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });
};

export const useUpdateTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: ({ taskId, taskData }) => updateTaskAPI(taskId, taskData),
    onSuccess: (updatedTask, variables) => {
      // Update the task in all relevant caches
      queryClient.setQueryData(['tasks'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((task) =>
          task.id === variables.taskId ? { ...task, ...updatedTask } : task
        );
      });
      
      // Update specific project caches
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      showSuccess('Task updated successfully!');
      
      if (onMutationSuccess) {
        onMutationSuccess(updatedTask);
      }
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      showErrorToast(handleApiError(error, 'updating the task'));
      
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });
};

export const useDeleteTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: deleteTaskAPI,
    onSuccess: (_, variables) => {
      // Remove the task from all relevant caches
      queryClient.setQueryData(['tasks'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((task) => task.id !== variables);
      });
      
      // Update specific project caches
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      showSuccess('Task deleted successfully!');
      
      if (onMutationSuccess) {
        onMutationSuccess();
      }
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      showErrorToast(handleApiError(error, 'deleting the task'));
      
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });
};

export const usePatchTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useError();

  return useMutation({
    mutationFn: ({ taskId, partialTaskData }) => patchTaskAPI(taskId, partialTaskData),
    onSuccess: (updatedTask, variables) => {
      // Optimistically update the task in all relevant caches
      queryClient.setQueryData(['tasks'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((task) =>
          task.id === variables.taskId ? { ...task, ...updatedTask } : task
        );
      });
      
      // Update specific project caches
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      if (onMutationSuccess) {
        onMutationSuccess(updatedTask);
      }
    },
    onError: (error) => {
      console.error('Error patching task:', error);
      showErrorToast(handleApiError(error, 'updating the task'));
      
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });
};