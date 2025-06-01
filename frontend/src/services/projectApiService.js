import { api } from './apiClient';

/**
 * Fetches all projects for the authenticated user.
 * @returns {Promise<Array>} A promise that resolves with the list of projects.
 * @throws {Error} If the API call fails.
 */
export const getAllProjects = async () => {
  const response = await api.get('/projects', 'fetching projects');
  return response.data?.projects || response.data;
};

/**
 * Creates a new project.
 * @param {object} projectData - The data for the new project (e.g., { name: string }).
 * @returns {Promise<object>} A promise that resolves with the created project data.
 * @throws {Error} If the API call fails.
 */
export const createProjectAPI = async (projectData) => {
  const response = await api.post('/projects', projectData, 'creating project');
  return response.data?.project || response.data;
};

/**
 * Updates an existing project.
 * @param {string} projectId - The ID of the project to update.
 * @param {object} projectData - The updated data for the project (e.g., { name: string }).
 * @returns {Promise<object>} A promise that resolves with the updated project data.
 * @throws {Error} If the API call fails.
 */
export const updateProjectAPI = async (projectId, projectData) => {
  const response = await api.put(
    `/projects/${projectId}`,
    projectData,
    'updating project'
  );
  return response.data?.project || response.data;
};

/**
 * Deletes a project by its ID.
 * @param {string} projectId - The ID of the project to delete.
 * @returns {Promise<object>} A promise that resolves with the API response data.
 * @throws {Error} If the API call fails.
 */
export const deleteProjectAPI = async (projectId) => {
  const response = await api.delete(
    `/projects/${projectId}`,
    'deleting project'
  );
  return response.data;
};
