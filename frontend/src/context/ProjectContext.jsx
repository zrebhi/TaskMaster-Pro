import React, { createContext, useState, useContext, useCallback } from 'react'; // Import useCallback
import axios from 'axios';
import AuthContext from './AuthContext'; // To get the token

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token, isAuthenticated, logout } = useContext(AuthContext);

  // Function to fetch projects (will be fully implemented for F-PROJ-02)
  const fetchProjects = useCallback(async () => { // Wrap with useCallback to avoid infinite loop
    if (!isAuthenticated || !token) {
      // Clear projects if not authenticated
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setProjects(response.data.projects || response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch projects.');
       if (err.response?.status === 401) {
          logout(); // Log out if token is invalid/expired
       }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, logout]);

  const addProject = (newProject) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  const updateProject = (updatedProject) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
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
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
