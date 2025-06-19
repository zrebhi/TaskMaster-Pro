// src/pages/ProjectTasksPage.jsx

import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import AddTaskForm from '../components/Tasks/AddTaskForm';
import EditTaskModal from '../components/Tasks/EditTaskModal';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import AddTaskModal from '../components/Tasks/AddTaskModal';
import TaskContext from '../context/TaskContext';
import ProjectContext from '../context/ProjectContext';

import { DataTable } from '../components/ui/tables/data-table';
import { DataTableToolbar } from '../components/ui/tables/data-table-toolbar';
import { columns as taskTableColumns } from '../components/Tasks/Table/columns';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const {
    projects,
    fetchProjects,
    isLoading: isLoadingProjects,
  } = useContext(ProjectContext);
  const { tasks, isLoadingTasks, taskError, fetchTasks, deleteTask } =
    useContext(TaskContext);

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [reactTableInstance, setReactTableInstance] = useState(null); // State for table instance
  const [columnVisibility, setColumnVisibility] = useState({}); // Lifted state

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects, fetchProjects]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  const selectedProject = projects.find((p) => p.id.toString() === projectId);

  const handleEditTask = useCallback(
    (task) => {
      const originalTask = tasks.find((t) => String(t.id) === String(task.id));
      setTaskToEdit(originalTask || task);
      setIsEditTaskModalOpen(true);
    },
    [tasks]
  );

  const handleCloseEditTaskModal = useCallback(() => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const handleDeleteTask = useCallback(
    (task) => {
      // Similar to handleEditTask, ensure correct task object is used.
      const originalTask = tasks.find((t) => String(t.id) === String(task.id));
      setTaskToDelete(originalTask || task);
      setIsDeleteTaskModalOpen(true);
    },
    [tasks]
  );

  const handleCloseDeleteTaskModal = useCallback(() => {
    setIsDeleteTaskModalOpen(false);
    setTaskToDelete(null);
  }, []);

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!taskToDelete) {
      handleCloseDeleteTaskModal();
      return;
    }
    try {
      await deleteTask(taskToDelete.id);
    } catch (err) {
      console.error('Delete task error:', err);
    } finally {
      handleCloseDeleteTaskModal();
    }
  }, [taskToDelete, deleteTask, handleCloseDeleteTaskModal]);

  // Transform tasks for the DataTable
  const transformedTasks = useMemo(() => {
    return tasks
      .filter((task) => task.project_id?.toString() === projectId) // Ensure tasks are for the current project
      .map((task) => ({
        ...task,
        id: String(task.id),
        priority: task.priority || 2,
        status: task.is_completed ? 'done' : 'to do',
        title: task.title || 'Untitled Task',
        due_date: task.due_date,
      }));
  }, [tasks, projectId]);

  if (isLoadingProjects) {
    return <p>Loading project details...</p>;
  }

  if (!selectedProject) {
    return (
      <div>
        <p>Project not found.</p>
        <Link to="/">← Back to all projects</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full p-4 md:p-8 gap-8">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← All Projects
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {selectedProject.name}
          </h2>
          <p className="text-muted-foreground">
            {selectedProject.description ||
              "Here's a list of tasks for this project."}
          </p>
        </div>
      </div>

      <hr className="my-4" />

      <div>
        {isLoadingTasks ? <p>Loading tasks...</p> : null}
        {taskError ? <p className="text-destructive">{taskError}</p> : null}
        {!isLoadingTasks &&
          !taskError &&
          (transformedTasks.length > 0 ? (
            <div>
              <div className="flex items-center justify-end mb-2 gap-2">
                {' '}
                {!!reactTableInstance && ( // Ensure boolean for conditional rendering
                  <DataTableToolbar table={reactTableInstance} columnVisibility={columnVisibility} />
                )}
                <Button
                  onClick={() => setIsAddTaskModalOpen(true)}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Task{' '}
                </Button>
              </div>
              <DataTable
                columns={taskTableColumns}
                data={transformedTasks}
                meta={{
                  onEdit: handleEditTask,
                  onDelete: handleDeleteTask,
                }}
                onTableInstanceReady={setReactTableInstance}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
              />
            </div>
          ) : (
            <div className="flex items-center flex-col">
              <AddTaskForm projectId={projectId} />
            </div>
          ))}
      </div>

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        projectId={projectId}
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
    </div>
  );
};

export default ProjectTasksPage;
