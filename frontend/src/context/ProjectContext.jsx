import { createContext, useState, useContext, useCallback } from 'react';
import AuthContext from './AuthContext';
import {
  getAllProjects,
  deleteProjectAPI,
  createProjectAPI,
  updateProjectAPI,
} from '../services/projectApiService';
import { useError } from './ErrorContext';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token, isAuthenticated } = useContext(AuthContext);
  const { showErrorToast, showSuccess } = useError();

  /**
   * Fetches all projects for the authenticated user and updates the state.
   */
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedProjects = await getAllProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      if (err.processedError) {
        showErrorToast(err.processedError);
        setError(err.processedError.message);
      } else {
        const fallbackMessage = 'Failed to fetch projects.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        setError(fallbackMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, showErrorToast]);

  /**
   * Creates a new project via the API and updates the state.
   * @param {object} projectData - The data for the new project (e.g., { name: string }).
   * @returns {Promise<object>} A promise that resolves with the created project data.
   * @throws {Error} If the API call fails.
   */
  const addProject = useCallback(
    async (projectData) => {
      if (!token) {
        const errorMessage = 'Authentication required to add project.';
        setError(errorMessage);
        showErrorToast({ message: errorMessage, severity: 'medium' });
        throw new Error(errorMessage);
      }
      setIsLoading(true);
      setError(null);
      try {
        const newProjectResponse = await createProjectAPI(projectData);
        const newProject = newProjectResponse.project || newProjectResponse;
        setProjects((prevProjects) => [newProject, ...prevProjects]);
        showSuccess('Project created successfully!');
        return newProject;
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to create project.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setError(fallbackMessage);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token, showErrorToast, showSuccess]
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
        const errorMessage = 'Authentication required to update project.';
        setError(errorMessage);
        showErrorToast({ message: errorMessage, severity: 'medium' });
        throw new Error(errorMessage);
      }
      setIsLoading(true);
      setError(null);
      try {
        const updatedProjectResponse = await updateProjectAPI(
          projectId,
          projectData
        );
        const updatedProject =
          updatedProjectResponse.project || updatedProjectResponse;
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          )
        );
        showSuccess('Project updated successfully!');
        return updatedProject;
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to update project.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setError(fallbackMessage);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token, showErrorToast, showSuccess]
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
      showSuccess('Project deleted successfully!');
    } catch (err) {
      if (err.processedError) {
        showErrorToast(err.processedError);
        setError(err.processedError.message);
      } else {
        const fallbackMessage = 'Failed to delete project.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        setError(fallbackMessage);
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
