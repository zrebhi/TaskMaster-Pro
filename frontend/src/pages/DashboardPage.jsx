import React, { useState, useEffect, useCallback, useContext } from "react";
import AddProjectForm from "../components/Projects/AddProjectForm";
import ProjectList from "../components/Projects/ProjectList";
import ProjectContext from "../context/ProjectContext";
import AuthContext from "../context/AuthContext";
import EditProjectModal from "../components/Projects/EditProjectModal";
import DeleteProjectModal from "../components/Projects/DeleteProjectModal.jsx";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const {
    projects,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    isLoading,
    error,
  } = useContext(ProjectContext);
  const { token } = useContext(AuthContext); // token is available if needed for API calls, though context handles it
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null); // Store {id, name}
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial projects when the component mounts or auth state changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectAdded = useCallback(
    (newProject) => {
      addProject(newProject);
      setActiveProjectId(newProject.id);
    },
    [addProject]
  );

  const handleSelectProject = useCallback((projectId) => {
    setActiveProjectId(projectId);
    // Will fetch tasks for this project (F-TASK-02)
  }, []);

  const handleEditClick = useCallback((project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  }, []);

  const handleProjectUpdated = useCallback(
    (updatedProject) => {
      updateProject(updatedProject);
    },
    [updateProject]
  );

  const handleDeleteClick = useCallback((projectId, projectName) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);

    try {
      await deleteProject(projectToDelete.id);

      // If the active project was deleted, clear activeProjectId and potentially tasks
      if (activeProjectId === projectToDelete.id) {
        setActiveProjectId(null);
        // Clear tasks for this project if they are loaded
      }
      handleCloseDeleteModal();
      toast.success(`Project "${projectToDelete.name}" deleted successfully!`);
    } catch (err) {
      console.error("Delete project error:", err);
      toast.error(
        `Failed to delete project: ${err.message || "Unknown error"}`
      );
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  }, [projectToDelete, deleteProject, activeProjectId, handleCloseDeleteModal]);

  return (
    <>
      <div style={{ display: "flex" }}>
        <aside
          style={{
            width: "30%",
            padding: "10px",
            borderRight: "1px solid #eee",
          }}
        >
          <h2>Dashboard</h2>
          <AddProjectForm onProjectAdded={handleProjectAdded} />
          <hr />
          <h3>Your Projects</h3>
          {isLoading && <p>Loading projects...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!isLoading && !error && (
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              activeProjectId={activeProjectId}
              onEditProject={handleEditClick}
              onDeleteProject={handleDeleteClick}
            />
          )}
        </aside>
        <main style={{ width: "70%", padding: "10px" }}>
          {/* ... TaskList area ... */}
           {activeProjectId ? (
            <h3>Tasks for Project ID: {activeProjectId}</h3>
          ) : (
            // <TaskList projectId={activeProjectId} /> {/* Placeholder for TaskList */}
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
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectToDelete?.name}"? This will also delete all associated tasks.`}
        isLoading={isDeleting}
      />
    </>
  );
};

export default DashboardPage;
