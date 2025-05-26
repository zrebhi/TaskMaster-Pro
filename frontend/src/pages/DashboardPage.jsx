import React, { useState, useEffect, useContext } from 'react';
import AddProjectForm from '../components/Projects/AddProjectForm';
import ProjectList from '../components/Projects/ProjectList';
import ProjectContext from '../context/ProjectContext';
import EditProjectModal from '../components/Projects/EditProjectModal';

const DashboardPage = () => {
  const { projects, fetchProjects, addProject, updateProject, isLoading, error } =
    useContext(ProjectContext);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

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

  // Handlers for Edit Modal
  const handleEditClick = (project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  };

  const handleProjectUpdated = (updatedProject) => {
    updateProject(updatedProject);
  };


  return (
    <> {/* Use Fragment shorthand */}
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '30%', padding: '10px', borderRight: '1px solid #eee' }}>
          <h2>Dashboard</h2> {/* Added Dashboard title */}
          <AddProjectForm onProjectAdded={handleProjectAdded} /> {/* Keep AddProjectForm */}
          <hr /> {/* Added horizontal rule */}
          <h3>Your Projects</h3> {/* Added Your Projects title */}
          {isLoading && <p>Loading projects...</p>} {/* Use context loading state */}
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Use context error state */}
          {!isLoading && !error && (
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              activeProjectId={activeProjectId}
              onEditProject={handleEditClick} // Pass the handler
            />
          )}
        </aside>
        <main style={{ width: '70%', padding: '10px' }}>
          {/* ... TaskList area ... */}
           {activeProjectId ? (
            <h3>Tasks for Project ID: {activeProjectId}</h3>
            // <TaskList projectId={activeProjectId} /> {/* Placeholder for TaskList */}
          ) : (
            <p>Select a project to view its tasks.</p>
          )}
        </main>
      </div>

      <EditProjectModal
        project={projectToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onProjectUpdated={handleProjectUpdated}
      />
    </>
  );
};

export default DashboardPage;
