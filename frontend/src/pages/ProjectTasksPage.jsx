//@ts-check
import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import EditTaskModal from '../components/Tasks/EditTaskModal';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import AddTaskModal from '../components/Tasks/AddTaskModal';
import TaskContext from '../context/TaskContext';
import ProjectContext from '../context/ProjectContext';
import { useError } from '../context/ErrorContext';
import { handleApiError } from '../utils/errorHandler';

import { DataTable } from '../components/ui/tables/data-table';
import { DataTableToolbar } from '../components/ui/tables/data-table-toolbar';
import { columns as taskTableColumns } from '../components/Tasks/Table/columns';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { priorities, statuses } from '../data/taskUIData';

/**
 * @typedef {object} TableMeta
 * @property {(task: object) => void} onEdit - Handler to trigger the edit modal.
 * @property {(task: object) => void} onDelete - Handler to trigger the delete confirmation modal.
 * @property {(task: object) => void} onToggleComplete - Handler to toggle the task's completion status.
 */

const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const {
    projects,
    fetchProjects,
    isLoading: isLoadingProjects,
  } = useContext(ProjectContext);
  const {
    tasks,
    isLoadingTasks,
    taskError,
    fetchTasks,
    deleteTask,
    updateTask,
  } = useContext(TaskContext);
  const { showErrorToast } = useError();

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false); // New state for delete loading
  const [reactTableInstance, setReactTableInstance] = useState(null); // State for table instance
  const [columnVisibility, setColumnVisibility] = useState({}); // Lifted state
  const [columnFilters, setColumnFilters] = useState(() => []); // Lifted state
  const [filteredRows, setFilteredRows] = useState([]); // State for filtered rows

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

  /**
   * Opens the edit modal and sets the task to be edited.
   * @param {object} task The full task object from the table row.
   */
  const handleEditTask = useCallback((task) => {
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  }, []);

  const handleCloseEditTaskModal = useCallback(() => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  }, []);

  /**
   * Opens the delete confirmation modal and sets the task to be deleted.
   * @param {object} task The full task object from the table row.
   */
  const handleDeleteTask = useCallback(
    (task) => {
      try {
        if (!task) {
          throw new Error(
            'handleDeleteTask was called with a null or undefined task.'
          );
        }
        // Similar to handleEditTask, ensure correct task object is used.
        setTaskToDelete(task);
        setIsDeleteTaskModalOpen(true);
      } catch (error) {
        const errorResult = handleApiError(error, 'deleting task');
        showErrorToast(errorResult);
      }
    },
    [showErrorToast]
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
    setIsDeletingTask(true);
    try {
      await deleteTask(taskToDelete.id);
    } catch (err) {
      console.error('Delete task error:', err);
    } finally {
      setIsDeletingTask(false);
      handleCloseDeleteTaskModal();
    }
  }, [taskToDelete, deleteTask, handleCloseDeleteTaskModal]);

  /**
   * Toggles the completion status of a task.
   * @param {object} task The full task object from the table row.
   */
  const handleToggleComplete = useCallback(
    async (task) => {
      try {
        if (!task) {
          throw new Error('handleToggleComplete was called without a task.');
        }
        await updateTask(task.id, { is_completed: !task.is_completed });
      } catch (error) {
        const errorResult = handleApiError(error, 'updating task status');
        showErrorToast(errorResult);
      }
    },
    [updateTask, showErrorToast]
  );

  // Transform tasks for the DataTable
  const transformedTasks = useMemo(() => {
    return tasks
      .filter((task) => task.project_id?.toString() === projectId) // Ensure tasks are for the current project
      .map((task) => ({
        ...task,
        id: String(task.id),
        priority: task.priority,
        status: task.is_completed ? 'done' : 'to do',
        title: task.title,
        due_date: task.due_date,
      }));
  }, [tasks, projectId]);

  const filtersConfig = [
    {
      columnId: 'priority',
      title: 'Priority',
      options: priorities,
    },
    {
      columnId: 'status',
      title: 'Status',
      options: statuses
    }
  ];

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
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">
            {selectedProject.name}
          </h2>
        </div>
      </div>

      {/* <hr className="my-4" /> */}

      <div className="flex flex-col flex-1">
        {isLoadingTasks ? <p>Loading tasks...</p> : null}
        {taskError ? <p className="text-destructive">{taskError}</p> : null}
        {!isLoadingTasks &&
          !taskError &&
          (transformedTasks.length > 0 ? (
            <div>
              <div className="flex items-end justify-end mb-2 gap-2">
                {' '}
                {!!reactTableInstance && ( // Ensure boolean for conditional rendering
                  <DataTableToolbar
                    table={reactTableInstance}
                    columnVisibility={columnVisibility}
                    columnFilters={columnFilters}
                    filtersConfig={filtersConfig}
                    rows={filteredRows}
                    onAdd={() => setIsAddTaskModalOpen(true)}
                    addButtonText="Add Task"
                  />
                )}
              </div>
              <DataTable
                columns={taskTableColumns}
                data={transformedTasks}
                /** @type {TableMeta} */
                meta={{
                  onEdit: handleEditTask,
                  onDelete: handleDeleteTask,
                  onToggleComplete: handleToggleComplete,
                }}
                onTableInstanceReady={setReactTableInstance}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onFilteredRowsChange={setFilteredRows}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  You have no task
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get started by creating a new Task.
                </p>
                <Button onClick={() => setIsAddTaskModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              </div>
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
        isLoading={isDeletingTask}
        confirmText="Delete"
        loadingText="Deleting..."
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default ProjectTasksPage;

