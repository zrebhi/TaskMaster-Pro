import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProjectTasksPage from '../../../pages/ProjectTasksPage';
import {
  renderWithMinimalProviders,
  createMockProject,
  createMockTask,
  setupTest,
  waitForElementToBeRemoved,
} from '../../helpers/test-utils';
import {
  createMockProjectContext,
  createMockTaskContext,
  createProjectContextWithProjects,
  createLoadingProjectContext,
  createTaskContextWithTasks,
  createLoadingTaskContext,
  createErrorTaskContext,
  TestProviders,
} from '../../helpers/mock-providers';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockShowErrorToast = jest.fn();

jest.mock('../../../context/ErrorContext', () => ({
  ...jest.requireActual('../../../context/ErrorContext'),
  useError: () => ({
    showErrorToast: mockShowErrorToast,
  }),
}));

let mockCapturedDataTableMeta = null;
let mockCapturedDataTableInstance = null;

jest.mock('../../../components/ui/tables/data-table', () => {
  const React = require('react');
  return {
    DataTable: jest.fn(({ data, meta, onTableInstanceReady }) => {
      // Capture the meta prop and table instance for direct testing
      mockCapturedDataTableMeta = meta;
      mockCapturedDataTableInstance = {
        getColumn: jest.fn(),
        getAllColumns: jest.fn(() => []),
      };
      React.useEffect(() => {
        if (onTableInstanceReady) {
          onTableInstanceReady(mockCapturedDataTableInstance);
        }
      }, [onTableInstanceReady]);

      return (
        <div data-testid="data-table">
          {/* Render a minimal representation to confirm data presence */}
          {data.map((task) => (
            <div key={task.id} data-testid={`task-${task.id}`}>
              <span>{task.title}</span>
            </div>
          ))}
        </div>
      );
    }),
  };
});

jest.mock('../../../components/ui/tables/data-table-toolbar', () => ({
  DataTableToolbar: jest.fn(({ table }) => (
    <div data-testid="data-table-toolbar">
      Toolbar for table: {table ? 'yes' : 'no'}
    </div>
  )),
}));

jest.mock('../../../components/Tasks/AddTaskModal', () => {
  return function MockAddTaskModal({ isOpen, onClose, projectId }) {
    return isOpen ? (
      <div data-testid="add-task-modal">
        <span>Add Task Modal for {projectId}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('../../../components/Tasks/AddTaskForm', () => {
  return function MockAddTaskForm({ projectId }) {
    return <div data-testid="add-task-form">Add Task Form for {projectId}</div>;
  };
});

jest.mock('../../../components/Tasks/EditTaskModal', () => {
  return function MockEditTaskModal({ task, isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="edit-task-modal">
        <span>Edit Task: {task?.title}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

let capturedOnConfirm;

jest.mock('../../../components/Common/ConfirmationModal', () => {
  return function MockConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    message,
    isLoading,
    confirmText,
    loadingText,
  }) {
    capturedOnConfirm = onConfirm;
    return isOpen ? (
      <div data-testid="delete-task-modal">
        <span>{message}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? loadingText : confirmText}
        </button>
      </div>
    ) : null;
  };
});

jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Plus: () => <div data-testid="plus-icon" />,
}));

describe('ProjectTasksPage Unit Tests', () => {
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    capturedOnConfirm = null;
    mockCapturedDataTableMeta = null;
    mockCapturedDataTableInstance = null;
  });

  const renderProjectTasksPage = (
    projectContextOverrides = {},
    taskContextOverrides = {},
    initialEntries = ['/projects/proj1'],
    tasks = [], // Add tasks parameter with a default empty array
    projects = [createMockProject({ id: 'proj1', name: 'Project 1' })] // Add projects parameter
  ) => {
    const defaultProjectContext = createProjectContextWithProjects(projects);
    const defaultTaskContext = createTaskContextWithTasks(tasks, {
      currentProjectIdForTasks: initialEntries[0].split('/').pop(), // Infer projectId from initialEntries
    });

    return renderWithMinimalProviders(
      <MemoryRouter initialEntries={initialEntries}>
        <TestProviders
          projectValue={{
            ...defaultProjectContext,
            ...projectContextOverrides,
          }}
          taskValue={{ ...defaultTaskContext, ...taskContextOverrides }}
        >
          <Routes>
            <Route
              path="/projects/:projectId?"
              element={<ProjectTasksPage />}
            />
          </Routes>
        </TestProviders>
      </MemoryRouter>
    );
  };

  describe('Initial Rendering and Project Loading', () => {
    test('fetches projects and tasks on mount if projectId is present', async () => {
      const mockFetchProjects = jest.fn();
      const mockFetchTasks = jest.fn();

      renderProjectTasksPage(
        createMockProjectContext({
          projects: [], // Start with no projects
          fetchProjects: mockFetchProjects,
          isLoading: false,
        }),
        createMockTaskContext({
          tasks: [], // Start with no tasks
          fetchTasks: mockFetchTasks,
        }),
        ['/projects/proj1']
      );

      await waitFor(() => {
        expect(mockFetchProjects).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(mockFetchTasks).toHaveBeenCalledWith('proj1');
      });
    });

    test('fetches tasks when projectId is available, even if projects are already loaded', async () => {
      const project1 = createMockProject({ id: 'proj1', name: 'Project 1' });
      const mockFetchProjects = jest.fn();
      const mockFetchTasks = jest.fn();

      renderProjectTasksPage(
        createMockProjectContext({
          projects: [project1], // Projects are already loaded
          fetchProjects: mockFetchProjects,
          isLoading: false,
        }),
        createMockTaskContext({
          tasks: [], // Start with no tasks
          fetchTasks: mockFetchTasks,
        }),
        ['/projects/proj1']
      );

      expect(mockFetchProjects).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(mockFetchTasks).toHaveBeenCalledWith('proj1');
      });
    });

    test('displays project loading message when projects are loading', () => {
      renderProjectTasksPage(createLoadingProjectContext({ projects: [] }));
      expect(
        screen.getByText(/loading project details.../i)
      ).toBeInTheDocument();
    });

    test('displays project not found message for invalid project ID when projects are loaded but ID does not match', () => {
      const project1 = createMockProject({ id: 'proj1', name: 'Project 1' });
      renderProjectTasksPage(createProjectContextWithProjects([project1]), {}, [
        '/projects/invalid-id',
      ]);
      expect(screen.getByText(/project not found/i)).toBeInTheDocument();
    });

    test('does not fetch tasks and shows "Project not found" if projectId is undefined in URL', async () => {
      renderProjectTasksPage(
        createMockProjectContext({
          projects: [createMockProject({ id: 'someProject' })],
          isLoading: false,
        }),
        createMockTaskContext(),
        ['/projects/']
      );

      await waitFor(() => {
        expect(screen.getByText(/project not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Display States', () => {
    test('displays task loading state', () => {
      renderProjectTasksPage({}, createLoadingTaskContext());
      expect(screen.getByText(/loading tasks.../i)).toBeInTheDocument();
    });

    test('displays task error state', () => {
      renderProjectTasksPage(
        {},
        createErrorTaskContext('Failed to load tasks')
      );
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });

    test('displays tasks when loaded and correctly maps completion status', () => {
      const tasks = [
        createMockTask({
          id: 'task1',
          title: 'Incomplete Task',
          project_id: 'proj1',
          is_completed: false,
        }),
        createMockTask({
          id: 'task2',
          title: 'Completed Task',
          project_id: 'proj1',
          is_completed: true,
        }),
      ];

      renderProjectTasksPage(
        createProjectContextWithProjects([
          createMockProject({ id: 'proj1', name: 'Project 1' }),
        ]),
        createTaskContextWithTasks(tasks, {
          currentProjectIdForTasks: 'proj1',
        })
      );

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByText('Incomplete Task')).toBeInTheDocument();
      expect(screen.getByText('Completed Task')).toBeInTheDocument();

      // Since DataTable is mocked, we can directly access its mock calls
      const dataTableProps = require('../../../components/ui/tables/data-table')
        .DataTable.mock.calls[0][0];
      const incompleteTask = dataTableProps.data.find((t) => t.id === 'task1');
      const completedTask = dataTableProps.data.find((t) => t.id === 'task2');

      expect(incompleteTask.status).toBe('to do');
      expect(completedTask.status).toBe('done');
    });

    test('displays AddTaskForm when project has no tasks', () => {
      renderProjectTasksPage(
        createProjectContextWithProjects([
          createMockProject({ id: 'proj1', name: 'Project 1' }),
        ]),
        createTaskContextWithTasks([], { currentProjectIdForTasks: 'proj1' })
      );
      expect(screen.getByTestId('add-task-form')).toBeInTheDocument();
      expect(screen.getByText('Add Task Form for proj1')).toBeInTheDocument();
    });
  });

  describe('Task Modal Management', () => {
    const testModalOpenClose = async (
      openButtonText,
      modalTestId,
      expectedModalContent,
      closeButtonText = 'Close',
      taskToInteractWith = null // New parameter for the specific task
    ) => {
      // renderProjectTasksPage is now called by the individual test cases
      // before calling this helper.

      if (openButtonText === 'Edit Task') {
        await act(async () => {
          mockCapturedDataTableMeta.onEdit(taskToInteractWith);
        });
      } else if (openButtonText === 'Delete Task') {
        await act(async () => {
          mockCapturedDataTableMeta.onDelete(taskToInteractWith);
        });
      } else {
        const openButton = screen.getByRole('button', { name: openButtonText });
        await user.click(openButton);
      }

      const modal = screen.getByTestId(modalTestId);
      expect(modal).toBeInTheDocument();
      expect(screen.getByText(expectedModalContent)).toBeInTheDocument();

      const closeButton = within(modal).getByText(closeButtonText);
      await user.click(closeButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId(modalTestId));
    };

    test('opens and closes add task modal', async () => {
      // Render with a mock task to ensure the DataTable and its toolbar are rendered,
      // which includes the "Add Task" button.
      const tasksWithOne = [createMockTask({ id: 'task1', title: 'Existing Task', project_id: 'proj1' })];
      renderProjectTasksPage(
        {},
        createTaskContextWithTasks(tasksWithOne, { currentProjectIdForTasks: 'proj1' }),
        ['/projects/proj1'],
        tasksWithOne
      );
      await testModalOpenClose(
        /add task/i,
        'add-task-modal',
        'Add Task Modal for proj1'
      );
    });

    test('opens and closes edit task modal', async () => {
      const taskToEdit = createMockTask({
        id: 'task1',
        title: 'Test Task',
        project_id: 'proj1',
      });
      renderProjectTasksPage(
        {},
        createTaskContextWithTasks([taskToEdit], { currentProjectIdForTasks: 'proj1' }),
        ['/projects/proj1'],
        [taskToEdit]
      );
      await testModalOpenClose(
        'Edit Task',
        'edit-task-modal',
        `Edit Task: ${taskToEdit.title}`,
        'Close',
        taskToEdit // Pass the specific task
      );
    });

    test('opens and closes delete task modal', async () => {
      const taskToDelete = createMockTask({
        id: 'task1',
        title: 'Test Task',
        project_id: 'proj1',
      });
      renderProjectTasksPage(
        {},
        createTaskContextWithTasks([taskToDelete], { currentProjectIdForTasks: 'proj1' }),
        ['/projects/proj1'],
        [taskToDelete]
      );
      await testModalOpenClose(
        'Delete Task',
        'delete-task-modal',
        new RegExp(`are you sure you want to delete the task "${taskToDelete.title}"`, 'i'),
        'Cancel',
        taskToDelete // Pass the specific task
      );
    });
  });

  describe('Delete Task Functionality', () => {
    const setupAndOpenDeleteModal = async (
      tasks,
      taskContextOverrides = {}
    ) => {
      renderProjectTasksPage(
        undefined, // projectContextOverrides
        taskContextOverrides, // taskContextOverrides
        ['/projects/proj1'], // initialEntries
        tasks, // tasks
        [createMockProject({ id: 'proj1', name: 'Project 1' })] // projects
      );

      await act(async () => {
        mockCapturedDataTableMeta.onDelete(tasks[0]);
      });

      const modal = screen.getByTestId('delete-task-modal');
      const confirmButton = within(modal).getByText('Delete');
      return { modal, confirmButton };
    };

    test('calls deleteTask when confirm button is clicked and closes modal', async () => {
      const mockDeleteTask = jest.fn().mockResolvedValue();
      const { confirmButton } = await setupAndOpenDeleteModal(
        [
          createMockTask({
            id: 'task1',
            title: 'Test Task',
            project_id: 'proj1',
          }),
        ],
        { deleteTask: mockDeleteTask }
      );

      await user.click(confirmButton);

      expect(mockDeleteTask).toHaveBeenCalledWith('task1');
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-task-modal')
      );
    });

    test('handles delete error gracefully and closes modal', async () => {
      const { consoleSpy, cleanup } = setupTest();
      const mockDeleteTask = jest
        .fn()
        .mockRejectedValue(new Error('Delete failed'));
      const { confirmButton } = await setupAndOpenDeleteModal(
        [
          createMockTask({
            id: 'task1',
            title: 'Test Task',
            project_id: 'proj1',
          }),
        ],
        { deleteTask: mockDeleteTask }
      );

      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith('task1');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Delete task error:',
        expect.any(Error)
      );
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-task-modal')
      );
      cleanup();
    });

    test('shows loading state during delete operation and closes modal', async () => {
      let resolveDelete;
      const mockDeleteTask = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          })
      );
      const { confirmButton } = await setupAndOpenDeleteModal(
        [
          createMockTask({
            id: 'task1',
            title: 'Test Task',
            project_id: 'proj1',
          }),
        ],
        { deleteTask: mockDeleteTask, isLoadingTasks: false }
      );

      await user.click(confirmButton);
      expect(mockDeleteTask).toHaveBeenCalledWith('task1');

      if (resolveDelete) resolveDelete();

      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-task-modal')
      );
    });

    test('shows an error toast if delete is attempted with a null task', async () => {
      const taskToTriggerNullDelete = createMockTask({
        id: 'task-null-delete',
        title: 'Task for Null Delete',
        project_id: 'proj1',
      });

      const mockDeleteTaskApiFn = jest.fn();
      renderProjectTasksPage(
        undefined,
        createTaskContextWithTasks([taskToTriggerNullDelete], {
          deleteTask: mockDeleteTaskApiFn,
          currentProjectIdForTasks: 'proj1',
        })
      );

      await act(async () => {
        mockCapturedDataTableMeta.onDelete(null);
      });

      expect(mockShowErrorToast).toHaveBeenCalled();
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            'An unexpected error occurred while deleting task'
          ),
        })
      );

      // The modal should not open
      expect(screen.queryByTestId('delete-task-modal')).not.toBeInTheDocument();
      // The API delete function should not be called
      expect(mockDeleteTaskApiFn).not.toHaveBeenCalled();
    });

    test('does not call deleteTask if confirmation is attempted when taskToDelete is null', async () => {
      const mockDeleteTask = jest.fn();
      const tasks = [
        createMockTask({
          id: 'task1',
          title: 'Test Task',
          project_id: 'proj1',
        }),
      ];
      renderProjectTasksPage(
        undefined,
        createTaskContextWithTasks(tasks, {
          deleteTask: mockDeleteTask,
          currentProjectIdForTasks: 'proj1',
        })
      );

      await act(async () => {
        mockCapturedDataTableMeta.onDelete(tasks[0]);
      });
      expect(screen.getByTestId('delete-task-modal')).toBeInTheDocument();

      // Close the modal by clicking cancel, which nullifies `taskToDelete`
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-task-modal')
      );

      // Now, call the captured onConfirm function, which should find taskToDelete to be null
      if (capturedOnConfirm) {
        await act(async () => {
          await capturedOnConfirm();
        });
      }

      // The deleteTask function should not have been called
      expect(mockDeleteTask).not.toHaveBeenCalled();
    });
  });
});
