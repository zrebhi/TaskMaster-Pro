import React, { useState, useEffect, useContext } from 'react';
import AddProjectForm from '../components/Projects/AddProjectForm';
// import ProjectList from '../components/Projects/ProjectList'; // Placeholder for actual ProjectList component
import ProjectContext from '../context/ProjectContext';

const DashboardPage = () => {
  const { projects, fetchProjects, addProject, isLoading, error } = useContext(ProjectContext);

  // Fetch initial projects when the component mounts or auth state changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // fetchProjects is stable due to useContext

  // Function to be called by AddProjectForm after a project is created
  const handleProjectAdded = (newProject) => {
    addProject(newProject); // Use the addProject function from context
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <AddProjectForm onProjectAdded={handleProjectAdded} />
      <hr />
      <h3>Your Projects</h3>
      {isLoading && <p>Loading projects...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && (
        // Will be replaced with actual ProjectList component
        <div>
          <h4>Project List (Placeholder)</h4>
          {projects.length === 0 ? (
            <p>No projects found. Create one above!</p>
          ) : (
            <ul>
              {projects.map(project => (
                <li key={project.id}>{project.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
