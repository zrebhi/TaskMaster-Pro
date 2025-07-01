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

/**
 * Updates an existing task.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} taskData - The updated data for the task (e.g., { title, description, priority, is_completed, ... }).
 * @returns {Promise<object>} A promise that resolves with the updated task data.
 * @throws {Error} If the API call fails.
 */
export const updateTaskDetails = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData, 'updating task');
  return response.data?.task || response.data;
};

/**
 * Deletes a task by its ID.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise<object>} A promise that resolves with the deletion response.
 * @throws {Error} If the API call fails.
 */
export const deleteTaskById = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`, 'deleting task');
  return response.data;
};

/**
 * Partially updates an existing task using PATCH. Ideal for inline editing.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} partialTaskData - An object with only the fields to update.
 * @returns {Promise<object>} A promise that resolves with the updated task data.
 */
export const patchTaskAPI = async (taskId, partialTaskData) => {
  const response = await api.patch(
    `/tasks/${taskId}`,
    partialTaskData,
    'updating task field'
  );
  return response.data?.task || response.data;
};
