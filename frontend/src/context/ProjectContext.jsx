import { createContext, useState, useContext, useCallback } from "react";
import AuthContext from "./AuthContext"; // To get the token
import {
  getAllProjects,
  deleteProjectAPI,
  createProjectAPI,
  updateProjectAPI,
} from "../services/projectApiService";
import toast from "react-hot-toast";

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token, isAuthenticated, logout } = useContext(AuthContext);

  /**
   * Fetches all projects for the authenticated user and updates the state.
   */
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !token) {
      // Clear projects if not authenticated
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedProjects = await getAllProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch projects."
      );
      if (err.response?.status === 401) {
        logout(); // Log out if token is invalid/expired
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, logout]);

  /**
   * Creates a new project via the API and updates the state.
   * @param {object} projectData - The data for the new project (e.g., { name: string }).
   * @returns {Promise<object>} A promise that resolves with the created project data.
   * @throws {Error} If the API call fails.
   */
  const addProject = useCallback(
    async (projectData) => {
      if (!token) {
        setError("Authentication required to add project.");
        throw new Error("Authentication required to add project.");
      }
      setIsLoading(true);
      setError(null);
      try {
        const newProjectResponse = await createProjectAPI(projectData, token);
        // Handle both { project: ... } and direct project object return structures
        const newProject = newProjectResponse.project || newProjectResponse;
        setProjects((prevProjects) => [newProject, ...prevProjects]);
        toast.success("Project created successfully!");
        return newProject;
      } catch (err) {
        console.error(
          "Error creating project:",
          err.response?.data || err.message
        );
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to create project.";
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 401) logout();
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token, logout]
  );

  /**
   * Updates an existing project via the API and updates the state.
   * @param {string} projectId - The ID of the project to update.
   * @param {object} projectData - The updated data for the project (e.g., { name: string }).
   * @returns {Promise<object>} A promise that resolves with the updated project data.
   * @throws {Error} If the API call fails.
   */
  const updateProject = useCallback(
    async (projectId, projectData) => {
      if (!token) {
        setError("Authentication required to update project.");
        throw new Error("Authentication required to update project.");
      }
      setIsLoading(true);
      setError(null);
      try {
        const updatedProjectResponse = await updateProjectAPI(
          projectId,
          projectData,
          token
        );
        // Handle both { project: ... } and direct project object return structures
        const updatedProject =
          updatedProjectResponse.project || updatedProjectResponse;
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          )
        );
        toast.success("Project updated successfully!");
        return updatedProject;
      } catch (err) {
        console.error(
          "Error updating project:",
          err.response?.data || err.message
        );
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to update project.";
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 401) logout();
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token, logout]
  );

  /**
   * Deletes a project by its ID using the API service and updates the state.
   * @param {string} projectId - The ID of the project to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion and state update are complete.
   * @throws {Error} If the API call fails.
   */
  const deleteProject = async (projectId) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteProjectAPI(projectId);
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== projectId)
      );
      toast.success("Project deleted successfully!");
    } catch (err) {
      console.error("Error deleting project:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete project.";
      setError(errorMessage);
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        error,
        fetchProjects,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
