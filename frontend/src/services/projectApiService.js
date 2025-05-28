import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
});

// Interceptor to automatically add the Authorization header
apiClient.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

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
 * Fetches all projects for the authenticated user.
 * @returns {Promise<Array>} A promise that resolves with the list of projects.
 * @throws {Error} If the API call fails.
 */
export const getAllProjects = async () => {
  try {
    const response = await apiClient.get("/projects");
    return response.data.projects || response.data; // Axios wraps response in 'data'
  } catch (error) {
    console.error(
      "Error fetching projects:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Creates a new project.
 * @param {object} projectData - The data for the new project (e.g., { name: string }).
 * @returns {Promise<object>} A promise that resolves with the created project data.
 * @throws {Error} If the API call fails.
 */
export const createProjectAPI = async (projectData) => {
  try {
    const response = await apiClient.post("/projects", projectData);
    return response.data.project || response.data;
  } catch (error) {
    console.error(
      "Error creating project:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Updates an existing project.
 * @param {string} projectId - The ID of the project to update.
 * @param {object} projectData - The updated data for the project (e.g., { name: string }).
 * @returns {Promise<object>} A promise that resolves with the updated project data.
 * @throws {Error} If the API call fails.
 */
export const updateProjectAPI = async (projectId, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data.project || response.data;
  } catch (error) {
    console.error(
      "Error updating project:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Deletes a project by its ID.
 * @param {string} projectId - The ID of the project to delete.
 * @returns {Promise<object>} A promise that resolves with the API response data.
 * @throws {Error} If the API call fails.
 */
export const deleteProjectAPI = async (projectId) => {
  try {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data; // Or handle 204 No Content appropriately
  } catch (error) {
    console.error(
      "Error deleting project:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || error;
  }
};
