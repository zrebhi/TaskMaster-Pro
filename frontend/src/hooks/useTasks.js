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
    const processedError = handleApiError(queryResult.error, 'fetching tasks');
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
    mutationFn: ({ projectId, taskData }) =>
      createTaskInProjectAPI(projectId, taskData),
    onMutate: async ({ projectId, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks =
        queryClient.getQueryData(['tasks', projectId]) || [];
      const newTask = { ...taskData, id: Date.now(), isOptimistic: true };
      queryClient.setQueryData(
        ['tasks', projectId],
        [...previousTasks, newTask]
      );
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        ['tasks', variables.projectId],
        context.previousTasks
      );
      showErrorToast(handleApiError(error, 'creating the task'));
      if (onMutationError) onMutationError(error);
    },
    onSuccess: (data, variables) => {
      showSuccess('Task created successfully!');
      queryClient.invalidateQueries({
        queryKey: ['tasks', variables.projectId],
      });
      if (onMutationSuccess) onMutationSuccess(data);
    },
  });
};

export const useUpdateTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: ({ taskId, taskData }) => updateTaskAPI(taskId, taskData),
    onMutate: async ({ projectId, taskId, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks =
        queryClient.getQueryData(['tasks', projectId]) || [];
      const updatedTasks = previousTasks.map((task) =>
        task.id === taskId ? { ...task, ...taskData } : task
      );
      queryClient.setQueryData(['tasks', projectId], updatedTasks);
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        ['tasks', variables.projectId],
        context.previousTasks
      );
      showErrorToast(handleApiError(error, 'updating the task'));
      if (onMutationError) onMutationError(error);
    },
    onSuccess: (data, variables) => {
      showSuccess('Task updated successfully!');
      queryClient.invalidateQueries({
        queryKey: ['tasks', variables.projectId],
      });
      if (onMutationSuccess) onMutationSuccess(data);
    },
  });
};

export const useDeleteTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: ({ taskId }) => deleteTaskAPI(taskId),
    onMutate: async ({ projectId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks =
        queryClient.getQueryData(['tasks', projectId]) || [];
      const updatedTasks = previousTasks.filter((task) => task.id !== taskId);
      queryClient.setQueryData(['tasks', projectId], updatedTasks);
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        ['tasks', variables.projectId],
        context.previousTasks
      );
      showErrorToast(handleApiError(error, 'deleting the task'));
      if (onMutationError) onMutationError(error);
    },
    onSuccess: (data, variables) => {
      showSuccess('Task deleted successfully!');
      queryClient.invalidateQueries({
        queryKey: ['tasks', variables.projectId],
      });
      if (onMutationSuccess) onMutationSuccess();
    },
  });
};

export const usePatchTask = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useError(); // We still need error toasts

  return useMutation({
    mutationFn: ({ taskId, partialTaskData }) =>
      patchTaskAPI(taskId, partialTaskData),
    onMutate: async ({ projectId, taskId, partialTaskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks =
        queryClient.getQueryData(['tasks', projectId]) || [];
      const updatedTasks = previousTasks.map((task) =>
        task.id === taskId ? { ...task, ...partialTaskData } : task
      );
      queryClient.setQueryData(['tasks', projectId], updatedTasks);
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        ['tasks', variables.projectId],
        context.previousTasks
      );
      showErrorToast(handleApiError(error, 'patching the task'));
      if (onMutationError) onMutationError(error);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', variables.projectId],
      });
      if (onMutationSuccess) onMutationSuccess(data);
    },
  });
};
