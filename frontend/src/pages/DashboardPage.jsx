import { useState, useEffect, useCallback, useContext } from 'react';
import AddProjectForm from '../components/Projects/AddProjectForm';
import ProjectList from '../components/Projects/ProjectList';
import ProjectContext from '../context/ProjectContext';
import TaskContext from '../context/TaskContext';
import EditProjectModal from '../components/Projects/EditProjectModal';
import TaskList from '../components/Tasks/TaskList';
import AddTaskForm from '../components/Tasks/AddTaskForm';
import EditTaskModal from '../components/Tasks/EditTaskModal';
import ConfirmationModal from '../components/Common/ConfirmationModal';

const DashboardPage = () => {
  const { projects, fetchProjects, deleteProject, isLoading, error } =
    useContext(ProjectContext);

  const {
    tasks,
    isLoadingTasks,
    taskError,
    fetchTasks,
    clearTasks,
    currentProjectIdForTasks,
    deleteTask,
  } = useContext(TaskContext);

  const [activeProjectId, setActiveProjectId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null); // Store {id, name}
  const [isDeleting, setIsDeleting] = useState(false);

  // Task modal states
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch initial projects when the component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch tasks when activeProjectId changes
  useEffect(() => {
    if (activeProjectId) {
      fetchTasks(activeProjectId);
    } else {
      clearTasks();
    }
  }, [activeProjectId, fetchTasks, clearTasks]);

  const handleSelectProject = useCallback((projectId) => {
    setActiveProjectId(projectId);
  }, []);

  const handleEditClick = useCallback((project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  }, []);

  const handleDeleteClick = useCallback((projectId, projectName) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);

    try {
      await deleteProject(projectToDelete.id);

      // If the active project was deleted, clear activeProjectId
      if (activeProjectId === projectToDelete.id) {
        setActiveProjectId(null);
      }
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Delete project error:', err);
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  }, [projectToDelete, deleteProject, activeProjectId, handleCloseDeleteModal]);

  // Task modal handlers
  const handleEditTask = useCallback((task) => {
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  }, []);

  const handleCloseEditTaskModal = useCallback(() => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const handleDeleteTask = useCallback((task) => {
    setTaskToDelete(task);
    setIsDeleteTaskModalOpen(true);
  }, []);

  const handleCloseDeleteTaskModal = useCallback(() => {
    setIsDeleteTaskModalOpen(false);
    setTaskToDelete(null);
  }, []);

  const handleConfirmDeleteTask = useCallback(async () => {
    try {
      await deleteTask(taskToDelete.id);
      handleCloseDeleteTaskModal();
    } catch (err) {
      console.error('Delete task error:', err);
      handleCloseDeleteTaskModal();
    }
  }, [taskToDelete, deleteTask, handleCloseDeleteTaskModal]);

  return (
    <>
      <div className="flex min-h-full">
        <aside
          style={{
            width: '30%',
            padding: '20px',
            borderRight: '1px solid #eee',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2>Projects</h2>
          <AddProjectForm />
          <hr style={{ margin: '20px 0' }} />
          <h3>Your Projects</h3>
          {isLoading ? <p>Loading projects...</p> : null}
          {error ? <p style={{ color: 'red' }}>{error}</p> : null}
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
        <main style={{ width: '70%', padding: '20px' }}>
          {activeProjectId && projects.find((p) => p.id === activeProjectId) ? (
            <>
              <h2>
                Tasks for:{' '}
                {projects.find((p) => p.id === activeProjectId)?.name}
              </h2>

              <section style={{ marginBottom: '20px' }}>
                <AddTaskForm projectId={activeProjectId} />
              </section>

              <hr style={{ margin: '20px 0' }} />

              {isLoadingTasks ? <p>Loading tasks...</p> : null}
              {taskError ? <p style={{ color: 'red' }}>{taskError}</p> : null}
              {!isLoadingTasks && !taskError && tasks.length > 0 && (
                <TaskList
                  tasks={tasks}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}
              {!isLoadingTasks &&
                !taskError &&
                tasks.length === 0 &&
                currentProjectIdForTasks === activeProjectId && (
                  <p>No tasks in this project yet. Add one!</p>
                )}
            </>
          ) : (
            <p
              style={{ textAlign: 'center', marginTop: '50px', color: '#777' }}
            >
              Select a project to view its tasks, or create a new project.
            </p>
          )}
        </main>
      </div>
      <EditProjectModal
        project={projectToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectToDelete?.name}"? This will also delete all associated tasks.`}
        isLoading={isDeleting}
        confirmText="Delete"
        loadingText="Deleting..."
        confirmButtonStyle="danger"
      />
      <EditTaskModal
        task={taskToEdit}
        isOpen={isEditTaskModalOpen}
        onClose={handleCloseEditTaskModal}
      />
      <ConfirmationModal
        isOpen={isDeleteTaskModalOpen}
        onClose={handleCloseDeleteTaskModal}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.title}"?`}
        isLoading={isLoadingTasks}
        confirmText="Delete"
        loadingText="Deleting..."
        confirmButtonStyle="danger"
      />
    </>
  );
};

export default DashboardPage;
