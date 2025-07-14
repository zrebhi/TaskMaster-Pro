import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllProjects,
  createProjectAPI,
  updateProjectAPI,
  deleteProjectAPI,
} from '@/services/projectApiService';
import { useError } from '@/context/ErrorContext';
import { handleApiError } from '@/utils/errorHandler';
  

export const useProjects = () => {
  const { showErrorToast } = useError();

  const queryResult = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  useEffect(() => {
    if (queryResult.error) {
      const processedError = handleApiError(
        queryResult.error,
        'fetching projects'
      );
      showErrorToast(processedError);
    }
  }, [queryResult.error, showErrorToast]);

  return queryResult;
};

/**
 * A collection of custom hooks for project mutations.
 */

export const useAddProject = ({ onMutationSuccess, onMutationError } = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationFn: createProjectAPI,
    onSuccess: (newProject) => {
      queryClient.setQueryData(['projects'], (oldData) => {
        const oldProjects = oldData ?? [];
        return [newProject, ...oldProjects];
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('Project created successfully!');

      // If a callback was provided to the hook, call it now.
      if (onMutationSuccess) {
        onMutationSuccess(newProject);
      }
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      showErrorToast(handleApiError(error, 'creating the project'));

      // If a callback was provided, call it.
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();

  return useMutation({
    mutationKey: ['updateProject'],
    mutationFn: ({ projectId, projectData }) =>
      updateProjectAPI(projectId, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('Project updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      const errorResult = handleApiError(error, 'updating the project');
      showErrorToast(errorResult);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorToast } = useError();


  return useMutation({
    mutationKey: ['deleteProject'],
    mutationFn: deleteProjectAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('Project deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      const errorResult = handleApiError(error, 'deleting the project');
      showErrorToast(errorResult);
    },
  });
};