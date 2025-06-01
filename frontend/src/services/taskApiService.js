import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Interceptor to automatically add the Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Fetches all tasks for a specific project.
 * @param {string} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves with the list of tasks.
 * @throws {Error} If the API call fails.
 */
export const getTasksForProjectAPI = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    return response.data?.tasks || [];
  } catch (error) {
    console.error(
      'Error fetching tasks for project:',
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Creates a new task within a project.
 * @param {string} projectId - The ID of the project.
 * @param {object} taskData - The data for the new task (e.g., { title, description, ... }).
 * @returns {Promise<object>} A promise that resolves with the created task data.
 * @throws {Error} If the API call fails.
 */
export const createTaskInProjectAPI = async (projectId, taskData) => {
  try {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, taskData);
    return response.data?.task || response.data;
  } catch (error) {
    console.error(
      'Error creating task:',
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};
