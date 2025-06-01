import { api } from './apiClient';

/**
 * Fetches all tasks for a specific project.
 * @param {string} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves with the list of tasks.
 * @throws {Error} If the API call fails.
 */
export const getTasksForProjectAPI = async (projectId) => {
  const response = await api.get(
    `/projects/${projectId}/tasks`,
    'fetching tasks'
  );
  return response.data?.tasks || [];
};

/**
 * Creates a new task within a project.
 * @param {string} projectId - The ID of the project.
 * @param {object} taskData - The data for the new task (e.g., { title, description, ... }).
 * @returns {Promise<object>} A promise that resolves with the created task data.
 * @throws {Error} If the API call fails.
 */
export const createTaskInProjectAPI = async (projectId, taskData) => {
  const response = await api.post(
    `/projects/${projectId}/tasks`,
    taskData,
    'creating task'
  );
  return response.data?.task || response.data;
};
