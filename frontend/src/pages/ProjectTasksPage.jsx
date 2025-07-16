import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import EditTaskModal from '@/components/Tasks/EditTaskModal';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import AddTaskModal from '@/components/Tasks/AddTaskModal';
import TaskDetailSheet from '@/components/Tasks/TaskDetailSheet';
import { useTasks, useDeleteTask, usePatchTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useError } from '@/context/ErrorContext';
import { handleApiError } from '@/utils/errorHandler';

import { DataTable } from '@/components/ui/tables/data-table';
import { DataTableToolbar } from '@/components/ui/tables/data-table-toolbar';
import { columns as taskTableColumns } from '@/components/Tasks/Table/columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { priorities, statuses } from '@/data/taskUIData';

const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: taskError,
  } = useTasks(projectId);
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: patchTask } = usePatchTask();
  const { showErrorToast } = useError();
  const queryClient = useQueryClient();

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // So that we edit one cell at a time
    const [selectedTaskId, setSelectedTaskId] = useState(null);

  const VISIBILITY_STORAGE_KEY = 'tasks-table-column-visibility';

  const getInitialVisibility = () => {
    try {
      const savedVisibility = localStorage.getItem(VISIBILITY_STORAGE_KEY);
      if (savedVisibility) {
        return JSON.parse(savedVisibility);
      }
    } catch (e) {
      console.error('Failed to parse column visibility from localStorage', e);
      // Fall through to default if parsing fails
    }

    // If no saved state, determine based on screen width
    // Hides 'due_date' on screens smaller than 768px by default
    if (window.innerWidth < 768) {
      return { due_date: false };
    }

    // Default for larger screens
    return {};
  };

  // State for Tanstack Table
  const [columnVisibility, setColumnVisibility] =
    useState(getInitialVisibility);
  const [columnFilters, setColumnFilters] = useState(() => []);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  // Effect to save column visibility changes to localStorage
  useEffect(() => {
    localStorage.setItem(
      VISIBILITY_STORAGE_KEY,
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  

  const selectedProject = projects.find((p) => p.id.toString() === projectId);

  // Effect to sync selectedTask with the main tasks list
  
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [tasks, selectedTaskId]
  );


  const handleEditTask = useCallback((task) => {
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  }, []);

  const handleCloseEditTaskModal = useCallback(() => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const handleDeleteTask = useCallback(
    (task) => {
      try {
        if (!task) {
          throw new Error(
            'handleDeleteTask was called with a null or undefined task.'
          );
        }
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

    deleteTask(
      { projectId, taskId: taskToDelete.id },
      {
        onSettled: () => {
          setIsDeletingTask(false);
          handleCloseDeleteTaskModal();
        },
      }
    );
  }, [taskToDelete, deleteTask, handleCloseDeleteTaskModal, projectId]);

  const handlePatchTask = useCallback(
    (taskId, data) => {
      try {
        // Pass projectId to the mutation
        patchTask({ projectId, taskId, partialTaskData: data });
      } catch (error) {
        // The mutation hook handles showing the error toast
        console.error('Failed to patch task:', error);
      }
    },
    [patchTask, projectId] // Add projectId to dependency array
  );

  const handleToggleComplete = useCallback(
    (task) => {
      // Only dispatch the update. Do not close the sheet.
      handlePatchTask(task.id, { is_completed: !task.is_completed });
    },
    [handlePatchTask]
  );

  const handleEditClick = (task) => {
    handleEditTask(task); // This opens the edit modal
        setSelectedTaskId(null); // This closes the detail sheet
  };

  const handleDeleteClick = (task) => {
    handleDeleteTask(task); // This opens the delete modal
        setSelectedTaskId(null); // This closes the detail sheet
  };

  // Transform tasks for the DataTable
  const transformedTasks = useMemo(() => {
    return tasks
      .filter((task) => task.project_id?.toString() === projectId)
      .map((task) => ({
        ...task,
        id: String(task.id),
        priority: task.priority,
        status: task.is_completed ? 'done' : 'to do',
        title: task.title,
        due_date: task.due_date,
      }));
  }, [tasks, projectId]);

  const table = useReactTable({
    data: transformedTasks,
    columns: taskTableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    autoResetPageIndex: false,
    meta: {
      onEdit: handleEditTask,
      onDelete: handleDeleteTask,
      onPatchTask: handlePatchTask,
      editingCell: editingCell,
      setEditingCell: setEditingCell,
      onViewTask: (task) => {
        setSelectedTaskId(task.id);
      },
      filtersConfig: [
        {
          columnId: 'priority',
          title: 'Priority',
          options: priorities,
        },
        {
          columnId: 'status',
          title: 'Status',
          options: statuses,
        },
      ],
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

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

      <div className="flex flex-col flex-1">
        {isLoadingTasks ? <p>Loading tasks...</p> : null}
        {taskError ? (
          <p className="text-destructive">{taskError.message}</p>
        ) : null}
        {!isLoadingTasks &&
          !taskError &&
          !!table &&
          (transformedTasks.length > 0 ? (
            <div>
              <div className="flex items-end justify-end mb-2">
                <DataTableToolbar
                  table={table}
                  onAdd={() => setIsAddTaskModalOpen(true)}
                  addButtonText="Add Task"
                  filterColumnId="title"
                  filterColumnPlaceholder="Search by task title..."
                />
              </div>
              <DataTable table={table} columns={taskTableColumns} />
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

      <TaskDetailSheet
                task={selectedTask}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onToggleComplete={handleToggleComplete}
      />

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
