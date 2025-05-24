import React, { useState, useEffect, useContext } from 'react';
import AddProjectForm from '../components/Projects/AddProjectForm';
import ProjectList from '../components/Projects/ProjectList';
import ProjectContext from '../context/ProjectContext';

const DashboardPage = () => {
  const { projects, fetchProjects, addProject, isLoading, error } = useContext(ProjectContext);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Fetch initial projects when the component mounts or auth state changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Function to be called by AddProjectForm after a project is created
  const handleProjectAdded = (newProject) => {
    addProject(newProject); // Use the addProject function from context
    setActiveProjectId(newProject.id);
  };

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    // Will fetch tasks for this project (F-TASK-02)
  };

  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '30%', padding: '10px', borderRight: '1px solid #eee' }}>
        <h2>Dashboard</h2>
        <AddProjectForm onProjectAdded={handleProjectAdded} />
        <hr />
        <h3>Your Projects</h3>
        {isLoading && <p>Loading projects...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoading && !error && (
          <ProjectList
            projects={projects}
            onSelectProject={handleSelectProject}
            activeProjectId={activeProjectId}
          />
        )}
      </aside>
      <main style={{ width: '70%', padding: '10px' }}>
        {/* TaskList will go here, showing tasks for activeProjectId */}
        {activeProjectId ? (
          <h3>Tasks for Project ID: {activeProjectId}</h3>
          // <TaskList projectId={activeProjectId} />
        ) : (
          <p>Select a project to view its tasks.</p>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
