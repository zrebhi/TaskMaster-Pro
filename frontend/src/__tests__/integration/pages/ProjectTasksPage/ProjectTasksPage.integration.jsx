/* eslint-disable no-undef */
/**
 * @file Integration tests for the ProjectTasksPage component.
 *
 * This test suite covers the following user stories:
 * - A user can see the loading, error, empty, and success states for tasks.
 * - A user can open and close modals for adding, editing, and deleting tasks.
 * - A user can perform full CRUD (Create, Read, Update, Delete) operations on tasks.
 * - A user can interact with the data table to sort and hide columns.
 * - The page is accessible.
 *
 * This suite uses a combination of mocked context providers for simple state testing
 * and a real TaskProvider for testing complex async logic like error handling.
 */
import { screen, render, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';

import ProjectTasksPage from '@/pages/ProjectTasksPage';
import {
  createMockProject,
  createMockTask,
  waitForElementToBeRemoved,
  setupTest,
  createMockApiError,
  createTestQueryClient,
} from '@/__tests__/helpers/test-utils';
import {
  TestAuthProvider,
  TestTaskProvider,
  TestErrorProvider,
  createAuthenticatedContext,
  createMockTaskContext,
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';

// Import the actual providers and contexts needed for the integration test
import { TaskProvider } from '@/context/TaskContext';
import AuthContext from '@/context/AuthContext';
import ErrorContext from '@/context/ErrorContext';

// Mock the underlying API services to isolate the frontend.
jest.mock('@/services/projectApiService');
jest.mock('@/services/taskApiService');

const { getAllProjects } = require('@/services/projectApiService');

/**
 * Renders the ProjectTasksPage with the real TaskProvider and mocked contexts for auth, project, and error.
 * This is used for testing the full async logic within TaskContext, such as optimistic updates and error handling.
 *
 * @param {object} authContextOverrides - Overrides for the mock AuthContext.
 * @param {object} errorContextOverrides - Overrides for the mock ErrorContext.
 * @returns {import('@testing-library/react').RenderResult & { queryClient: import('@tanstack/react-query').QueryClient }}
 */
const renderTasksPageWithProviders = (
  authContextOverrides = {},
  errorContextOverrides = {}
) => {
  const queryClient = createTestQueryClient();
  const authValue = createAuthenticatedContext(authContextOverrides);
  const errorValue = createMockErrorContext(errorContextOverrides);

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <AuthContext.Provider value={authValue}>
          <ErrorContext.Provider value={errorValue}>
            <TaskProvider>
              <Routes>
                <Route
                  path="/projects/:projectId"
                  element={<ProjectTasksPage />}
                />
              </Routes>
            </TaskProvider>
          </ErrorContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { ...renderResult, queryClient };
};

describe('Integration Test: ProjectTasksPage', () => {
  let user;
  let cleanup;
  const project = createMockProject({ id: 'proj-1' });

  beforeEach(() => {
    // setupTest mocks console.error and handles cleanup
    ({ cleanup } = setupTest());
    user = userEvent.setup();
    // Mock the project fetch for all tests, as the page depends on it.
    /** @type {jest.Mock} */ (getAllProjects).mockResolvedValue([project]);
  });

  afterEach(() => {
    cleanup();
  });

  // Test suite for the initial rendering and data states of the page.
  describe('1. Initial Render & Data States', () => {
    it('should display a loading indicator when isLoadingTasks is true', () => {
      // eslint-disable-next-line no-undef
      renderComponent({ isLoadingTasks: true });
      expect(screen.getByText(/loading tasks.../i)).toBeInTheDocument();
    });

    it('should display an error message when taskError has a value', () => {
      renderComponent({ taskError: 'Failed to fetch tasks.' });
      expect(screen.getByText(/failed to fetch tasks/i)).toBeInTheDocument();
    });

    it('should render the list of tasks provided by the context on a successful load', async () => {
      const tasks = [
        createMockTask({
          id: 'task-1',
          title: 'First Task',
          project_id: 'proj-1',
        }),
        createMockTask({
          id: 'task-2',
          title: 'Second Task',
          project_id: 'proj-1',
        }),
      ];
      renderComponent({ tasks, isLoadingTasks: false, currentProjectIdForTasks: 'proj-1' });
      await waitFor(() => {
        expect(screen.getByText(/first task/i)).toBeInTheDocument();
        expect(screen.getByText(/second task/i)).toBeInTheDocument();
      });
    });

    it('should display an empty state message if no tasks are provided', async () => {
      renderComponent({ tasks: [], isLoadingTasks: false });
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /you have no task/i })
        ).toBeInTheDocument();
      });
    });
  });

  // Test suite for all Create, Read, Update, and Delete (CRUD) operations,
  // including the modal interactions involved in these flows.
  describe('2. Row Actions & Modal Flows', () => {
    const task = createMockTask({
      id: 'task-1',
      title: 'Task to be Edited',
      project_id: 'proj-1',
    });

    it('should open the Edit Task modal when the "Edit" action is clicked on a task row', async () => {
      renderComponent({ tasks: [task], currentProjectIdForTasks: 'proj-1' });
      await screen.findByText(task.title);

      const row = screen.getByText(task.title).closest('tr');
      const menuButton = within(row).getByRole('button', {
        name: /open menu/i,
      });
      await user.click(menuButton);

      const editMenuItem = await screen.findByRole('menuitem', {
        name: /edit/i,
      });
      await user.click(editMenuItem);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /edit task/i })
      ).toBeInTheDocument();
    });

    it('should close the Edit Task modal when its "Cancel" button is clicked', async () => {
      renderComponent({ tasks: [task], currentProjectIdForTasks: 'proj-1' });
      await screen.findByText(task.title);

      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

      const cancelButton = await screen.findByRole('button', {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    });

    it('should open the Confirmation modal when the "Delete" action is clicked on a task row', async () => {
      renderComponent({ tasks: [task], currentProjectIdForTasks: 'proj-1' });
      await screen.findByText(task.title);

      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /delete task/i })
      ).toBeInTheDocument();
    });

    it('should call the deleteTask context function and remove the task from the view when deletion is confirmed', async () => {
      const deleteTaskMock = jest.fn().mockResolvedValue({});
      const { rerender } = renderComponent({
        tasks: [task],
        deleteTask: deleteTaskMock,
        currentProjectIdForTasks: 'proj-1',
      });

      await screen.findByText(task.title);
      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );
      await user.click(await screen.findByRole('button', { name: /delete/i }));

      // Assertion: Mock function was called
      expect(deleteTaskMock).toHaveBeenCalledWith(task.id);

      // Simulate the context update by re-rendering with the new state
      const AllProviders = ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/projects/proj-1']}>
            <TestErrorProvider value={createMockErrorContext()}>
              <TestAuthProvider value={createAuthenticatedContext()}>
                <TestTaskProvider
                  value={createMockTaskContext({
                    tasks: [],
                    deleteTask: deleteTaskMock,
                    currentProjectIdForTasks: 'proj-1',
                  })}
                >
                  {children}
                </TestTaskProvider>
              </TestAuthProvider>
            </TestErrorProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
      rerender(
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
        </Routes>,
        { wrapper: AllProviders }
      );

      // Assertion: Task is removed from the UI
      await waitFor(() => {
        expect(screen.queryByText(task.title)).not.toBeInTheDocument();
      });
    });

    it('should display a toast notification if the deleteTask context function throws an error', async () => {
      // GIVEN: An API that fails and necessary mocks
      const error = createMockApiError(
        500,
        'API Error: Could not delete',
        'high'
      );
      const {
        deleteTaskById,
        getTasksForProjectAPI,
      } = require('@/services/taskApiService');
      /** @type {jest.Mock} */ (deleteTaskById).mockRejectedValue(error);
      /** @type {jest.Mock} */ (getTasksForProjectAPI).mockResolvedValue([
        task,
      ]);
      const showErrorToastMock = jest.fn();

      // WHEN: The component is rendered using the real TaskProvider
      renderTasksPageWithProviders({}, { showErrorToast: showErrorToastMock });

      // AND: The user performs the delete action
      // Wait for the page to finish loading initial data
      expect(await screen.findByText(task.title)).toBeInTheDocument();

      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );
      await user.click(await screen.findByRole('button', { name: /delete/i }));

      // 4. Assert the side-effect (toast) happened
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'API Error: Could not delete' })
        );
      });

      // Task should still be visible because the deletion failed
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });

    it('should update the task in the table after a successful edit', async () => {
      // 1. Setup Mocks
      const updateTaskMock = jest.fn().mockResolvedValue({});
      const updatedTask = { ...task, title: 'An Edited Task Title' };

      const { rerender } = renderComponent({
        tasks: [task],
        updateTask: updateTaskMock,
        currentProjectIdForTasks: 'proj-1',
      });

      // 2. Open the edit modal
      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

      // 3. Edit the form
      const titleInput = await screen.findByLabelText(/task title/i);
      await user.clear(titleInput);
      await user.type(titleInput, updatedTask.title);

      // 4. Submit the form
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // 5. Assertions
      await waitFor(() => {
        expect(updateTaskMock).toHaveBeenCalledWith(
          task.id,
          expect.objectContaining({
            title: updatedTask.title,
          })
        );
      });

      // To simulate the context update, re-render with the modified task data
      const AllProviders = ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/projects/proj-1']}>
            <TestErrorProvider value={createMockErrorContext()}>
              <TestAuthProvider value={createAuthenticatedContext()}>
                <TestTaskProvider
                  value={createMockTaskContext({
                    tasks: [updatedTask], // Use the updated task
                    updateTask: updateTaskMock,
                    currentProjectIdForTasks: 'proj-1',
                  })}
                >
                  {children}
                </TestTaskProvider>
              </TestAuthProvider>
            </TestErrorProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
      rerender(
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
        </Routes>,
        { wrapper: AllProviders }
      );

      // The modal should be gone
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // The new title should be visible
      expect(screen.getByText(updatedTask.title)).toBeInTheDocument();
      // The old title should be gone
      expect(screen.queryByText(task.title)).not.toBeInTheDocument();
    });
    describe('Task Completion Flow', () => {
      // Use the same project setup

      // Test 1: The "Happy Path"
      it('should call patchTask, apply a line-through style, and update the action text when a task is marked as complete', async () => {
        // GIVEN: An incomplete task and a mock patch function
        const incompleteTask = createMockTask({
          id: 'task-complete-1',
          title: 'Finish the report',
          is_completed: false,
          project_id: 'proj-1',
        });
        const patchTaskMock = jest.fn().mockResolvedValue({});
        const updatedTask = { ...incompleteTask, is_completed: true };

        const { rerender } = renderComponent({
          tasks: [incompleteTask],
          patchTask: patchTaskMock,
          currentProjectIdForTasks: 'proj-1',
        });

        // WHEN: The user marks the task as complete by clicking the status cell
        const row = screen.getByText(incompleteTask.title).closest('tr');
        const statusCell = within(row).getByRole('button', {
          name: /toggle status/i,
        });
        await user.click(statusCell);

        const AllProviders = ({ children }) => (
          <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={['/projects/proj-1']}>
              <TestErrorProvider value={createMockErrorContext()}>
                <TestAuthProvider value={createAuthenticatedContext()}>
                  <TestTaskProvider
                    value={createMockTaskContext({
                      tasks: [updatedTask], // Simulate the state update
                      patchTask: patchTaskMock,
                      currentProjectIdForTasks: 'proj-1',
                    })}
                  >
                    {children}
                  </TestTaskProvider>
                </TestAuthProvider>
              </TestErrorProvider>
            </MemoryRouter>
          </QueryClientProvider>
        );

        // THEN: The UI updates after the state changes (simulated via rerender)
        rerender(
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
          </Routes>,
          { wrapper: AllProviders }
        );

        expect(row).toHaveAttribute('data-completed', 'true');
        expect(within(row).getByText('Done')).toBeInTheDocument();

        // Assert the behavioral text change in the dropdown
        await user.click(
          within(row).getByRole('button', { name: /open menu/i })
        );
        expect(
          await screen.findByRole('menuitem', { name: /mark as incomplete/i })
        ).toBeInTheDocument();
      });

      // Test 2: The "Reverse Path"
      it('should update the UI correctly when a task is marked as incomplete', async () => {
        // GIVEN: A completed task
        const completedTask = createMockTask({
          id: 'task-uncomplete-1',
          title: 'A finished task',
          is_completed: true,
          project_id: 'proj-1',
        });
        const patchTaskMock = jest.fn().mockResolvedValue({});
        const updatedTask = { ...completedTask, is_completed: false };

        const { rerender } = renderComponent({
          tasks: [completedTask],
          patchTask: patchTaskMock,
          currentProjectIdForTasks: 'proj-1',
        });

        // WHEN: The user marks the task as incomplete by clicking the status cell
        const row = screen.getByText(completedTask.title).closest('tr');
        const statusCell = within(row).getByRole('button', {
          name: /toggle status/i,
        });
        await user.click(statusCell);

        const AllProviders = ({ children }) => (
          <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={['/projects/proj-1']}>
              <TestErrorProvider value={createMockErrorContext()}>
                <TestAuthProvider value={createAuthenticatedContext()}>
                  <TestTaskProvider
                    value={createMockTaskContext({
                      tasks: [updatedTask], // Simulate the optimistic state update
                      patchTask: patchTaskMock,
                      currentProjectIdForTasks: 'proj-1',
                    })}
                  >
                    {children}
                  </TestTaskProvider>
                </TestAuthProvider>
              </TestErrorProvider>
            </MemoryRouter>
          </QueryClientProvider>
        );

        // THEN: The UI should reflect the change optimistically.
        rerender(
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
          </Routes>,
          { wrapper: AllProviders }
        );

        // Assert the data attribute has been removed/set to false
        expect(row).toHaveAttribute('data-completed', 'false');
        // Assert the user-visible status text has changed
        expect(within(row).getByText('To Do')).toBeInTheDocument();
      });

      // Test 3: The "Error Path"
      it('should display a toast and revert the UI if the update fails', async () => {
        // GIVEN: A task and a patch API that will fail
        const task = createMockTask({
          id: 'task-fail-1',
          title: 'Task that will fail',
          is_completed: false,
          project_id: 'proj-1',
        });
        const error = createMockApiError(500, 'Server is down', 'high');
        const {
          patchTaskAPI,
          getTasksForProjectAPI,
        } = require('@/services/taskApiService');
        /** @type {jest.Mock} */ (patchTaskAPI).mockRejectedValue(error);
        /** @type {jest.Mock} */ (getTasksForProjectAPI).mockResolvedValue([
          task,
        ]);
        const showErrorToastMock = jest.fn();

        // WHEN: The component is rendered with the real TaskProvider
        renderTasksPageWithProviders({}, { showErrorToast: showErrorToastMock });
        expect(await screen.findByText(task.title)).toBeInTheDocument();

        // AND: The user tries to mark the task as complete
        const row = screen.getByText(task.title).closest('tr');
        const statusCell = within(row).getByRole('button', {
          name: /toggle status/i,
        });
        await user.click(statusCell);

        // THEN: The error toast is displayed
        await waitFor(() => {
          expect(showErrorToastMock).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Server is down' })
          );
        });

        // AND: The UI reverts to its original state
        expect(row).toHaveAttribute('data-completed', 'false');
        expect(within(row).getByText('To Do')).toBeInTheDocument();
      });
    });
  });

  // Test suite for the "Add Task" flow.
  describe('3. Add Task Flow', () => {
    it('should open the Add Task modal when the "Add Task" button is clicked', async () => {
      renderComponent({ tasks: [] });
      await screen.findByRole('heading', { name: /you have no task/i });
      await user.click(await screen.findByRole('button', { name: /add task/i }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /create new task/i })
      ).toBeInTheDocument();
    });

    it('should call the addTask context function when the add task form is submitted successfully', async () => {
      const addTaskMock = jest
        .fn()
        .mockResolvedValue(createMockTask({ id: 'new-task' }));
      renderComponent({ tasks: [], addTask: addTaskMock });

      await screen.findByRole('heading', { name: /you have no task/i });
      await user.click(screen.getByRole('button', { name: /add task/i }));
      await user.type(
        await screen.findByLabelText(/task title/i),
        'A brand new task'
      );
      await user.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(addTaskMock).toHaveBeenCalledWith(
          'proj-1',
          expect.objectContaining({
            title: 'A brand new task',
          })
        );
      });
    });

    it('should add the new task to the table when the add task form is submitted successfully', async () => {
      const newTask = createMockTask({
        id: 'new-task-123',
        title: 'A brand new task',
        project_id: 'proj-1',
      });
      const addTaskMock = jest.fn().mockResolvedValue(newTask);

      const { rerender } = renderComponent({ tasks: [], addTask: addTaskMock });
      await screen.findByRole('heading', { name: /you have no task/i });
      await user.click(screen.getByRole('button', { name: /add task/i }));
      await user.type(
        await screen.findByLabelText(/task title/i),
        newTask.title
      );
      await user.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => expect(addTaskMock).toHaveBeenCalled());

      const AllProviders = ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/projects/proj-1']}>
            <TestErrorProvider value={createMockErrorContext()}>
              <TestAuthProvider value={createAuthenticatedContext()}>
                <TestTaskProvider
                  value={createMockTaskContext({
                    tasks: [newTask],
                    currentProjectIdForTasks: 'proj-1',
                  })}
                >
                  {children}
                </TestTaskProvider>
              </TestAuthProvider>
            </TestErrorProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
      // Re-render with the new task to simulate context update
      rerender(
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
        </Routes>,
        { wrapper: AllProviders }
      );
      expect(await screen.findByText(newTask.title)).toBeInTheDocument();
    });
  });

  // Test suite for key interactive UI behaviors like sorting and column visibility.
  describe('4. Key Interactive Behaviors', () => {
    const project = createMockProject({ id: 'proj-1' });
    const tasks = [
      createMockTask({
        id: 'task-a',
        title: 'A Task',
        priority: 1,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-b',
        title: 'B Task',
        priority: 3,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-c',
        title: 'C Task',
        priority: 2,
        project_id: 'proj-1',
      }),
    ];

    it('should hide a column when it is deselected from the "View" toggle menu', async () => {
      renderComponent(
        { projects: [project] },
        { tasks, currentProjectIdForTasks: 'proj-1' }
      );

      expect(
        screen.getByRole('columnheader', { name: /due date/i })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /view/i }));
      await user.click(
        await screen.findByRole('option', { name: /due date/i })
      );
      expect(
        screen.queryByRole('columnheader', { name: /due date/i })
      ).not.toBeInTheDocument();
    });

    it('should reorder the tasks in the DOM when a sortable column header is clicked', async () => {
      renderComponent(
        { projects: [project] },
        { tasks, currentProjectIdForTasks: 'proj-1' }
      );

      const getTitleColumnText = () =>
        screen
          .getAllByRole('row')
          .slice(1) // Exclude header row
          .map((row) => {
            const cells = within(row).getAllByRole('cell');
            return cells[0].textContent; // The first cell is the title
          });

      // Check initial, unsorted order (based on mock data array)
      expect(getTitleColumnText()).toEqual(['A Task', 'B Task', 'C Task']);

      // --- Sort Ascending ---
      const titleHeader = screen.getByRole('button', { name: /title/i });
      await user.click(titleHeader); // Open dropdown
      const ascMenuItem = await screen.findByRole('menuitem', { name: 'Asc' });
      await user.click(ascMenuItem);

      // After sorting by title ascending, order should be A, B, C
      await waitFor(() => {
        expect(getTitleColumnText()).toEqual(['A Task', 'B Task', 'C Task']);
      });

      // --- Sort Descending ---
      await user.click(titleHeader); // Re-open dropdown
      const descMenuItem = await screen.findByRole('menuitem', {
        name: 'Desc',
      });
      await user.click(descMenuItem);

      // After sorting by title descending, order should be C, B, A
      await waitFor(() => {
        expect(getTitleColumnText()).toEqual(['C Task', 'B Task', 'A Task']);
      });
    });
    describe('Responsive Column Visibility with Persistence', () => {
      // Store the original window properties to restore after tests
      const originalInnerWidth = window.innerWidth;
      const originalLocalStorage = window.localStorage;
      const project = createMockProject({ id: 'proj-1' });
      const tasks = [
        createMockTask({
          id: 'task-1',
          title: 'A Task',
          project_id: 'proj-1',
          due_date: '2025-01-01T00:00:00.000Z',
        }),
      ];

      beforeAll(() => {
        // Mock localStorage
        let store = {};
        const localStorageMock = {
          getItem: jest.fn((key) => store[key] || null),
          setItem: jest.fn((key, value) => {
            store[key] = value.toString();
          }),
          clear: jest.fn(() => {
            store = {};
          }),
          removeItem: jest.fn((key) => {
            delete store[key];
          }),
          length: 0, // Add length property
          key: jest.fn(), // Add key function
        };
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
          writable: true,
          configurable: true,
        });
      });

      beforeEach(() => {
        // Clear localStorage before each test to ensure isolation
        window.localStorage.clear();
      });

      afterEach(() => {
        // Restore window width after each test
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: originalInnerWidth,
        });
      });

      afterAll(() => {
        // Restore localStorage after all tests in this suite
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
        });
      });

      it('should hide the "Due Date" column by default on mobile screens', () => {
        // GIVEN a mobile screen width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        });

        // WHEN the component is rendered for the first time
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );

        // THEN the "Due Date" column should not be visible
        expect(
          screen.queryByRole('columnheader', { name: /due date/i })
        ).not.toBeInTheDocument();
      });

      it('should show the "Due Date" column by default on desktop screens', () => {
        // GIVEN a desktop screen width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });

        // WHEN the component is rendered for the first time
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );

        // THEN the "Due Date" column should be visible
        expect(
          screen.getByRole('columnheader', { name: /due date/i })
        ).toBeInTheDocument();
      });

      it('should remember the user’s choice to show and then hide a column across page reloads', async () => {
        // GIVEN a mobile screen width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        });
        const { unmount } = renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );
        expect(
          screen.queryByRole('columnheader', { name: /due date/i })
        ).not.toBeInTheDocument();

        // WHEN the user shows the column
        await user.click(screen.getByRole('button', { name: /view/i }));
        await user.click(
          await screen.findByRole('option', { name: /due date/i })
        );
        expect(
          screen.getByRole('columnheader', { name: /due date/i })
        ).toBeInTheDocument();

        // AND the page is "reloaded" (unmount and re-render)
        unmount();
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );

        // THEN the choice to show the column is remembered
        expect(
          screen.getByRole('columnheader', { name: /due date/i })
        ).toBeInTheDocument();

        // AND WHEN the user hides the column again
        await user.click(screen.getByRole('button', { name: /view/i }));
        await user.click(
          await screen.findByRole('option', { name: /due date/i })
        );
        expect(
          screen.queryByRole('columnheader', { name: /due date/i })
        ).not.toBeInTheDocument();

        // AND the page is "reloaded" again
        unmount();
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );

        // THEN the choice to hide the column is also remembered
        expect(
          screen.queryByRole('columnheader', { name: /due date/i })
        ).not.toBeInTheDocument();
      });
    });
    describe('Interactive Filtering', () => {
      const project = createMockProject({ id: 'proj-1' });
      const tasks = [
        createMockTask({
          id: 'task-1',
          title: 'Implement login page',
          is_completed: true, // status: done
          priority: 3,
          project_id: 'proj-1',
        }),
        createMockTask({
          id: 'task-2',
          title: 'Design database schema',
          is_completed: false, // status: to do
          priority: 3,
          project_id: 'proj-1',
        }),
        createMockTask({
          id: 'task-3',
          title: 'Implement user dashboard',
          is_completed: false, // status: to do
          priority: 2,
          project_id: 'proj-1',
        }),
      ];

      it('should filter the table when a status is selected using the checkbox filter', async () => {
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );
        const toolbar = screen.getByRole('toolbar');

        // WHEN: The user opens the filter and checks "Done"
        await user.click(
          within(toolbar).getByRole('button', { name: /status/i })
        );
        const doneCheckbox = await screen.findByRole('option', {
          name: /done/i,
        });
        await user.click(doneCheckbox);

        // THEN: Only 'done' tasks are visible
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.queryByText('Design database schema')
          ).not.toBeInTheDocument();
        });

        // AND WHEN: The user also checks "To Do"
        const todoCheckbox = screen.getByRole('option', {
          name: /to do/i,
        });
        await user.click(todoCheckbox);

        // THEN: All tasks are visible again
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.getByText('Design database schema')
          ).toBeInTheDocument();
        });
      });

      it('should clear all active filters when the "Reset" button is clicked', async () => {
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );
        const toolbar = screen.getByRole('toolbar');

        // GIVEN: A filter is active
        await user.click(
          within(toolbar).getByRole('button', { name: /status/i })
        );
        const doneCheckbox = await screen.findByRole('option', {
          name: /done/i,
        });
        await user.click(doneCheckbox);

        // Assert that the list is filtered
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.queryByText('Design database schema')
          ).not.toBeInTheDocument();
        });

        // WHEN: The user clicks the reset button
        const resetButton = within(toolbar).getByRole('button', {
          name: /reset/i,
        });
        await user.click(resetButton);

        // THEN: All tasks are visible again
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.getByText('Design database schema')
          ).toBeInTheDocument();
          expect(
            screen.getByText('Implement user dashboard')
          ).toBeInTheDocument();
        });
      });
      it('should deselect a filter when clicking the option again', async () => {
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );
        const toolbar = screen.getByRole('toolbar');

        // GIVEN: The "Done" filter is active
        await user.click(
          within(toolbar).getByRole('button', { name: /status/i })
        );
        const doneCheckbox = await screen.findByRole('option', {
          name: /done/i,
        });
        await user.click(doneCheckbox);

        // Assert that the list is filtered
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.queryByText('Design database schema')
          ).not.toBeInTheDocument();
        });

        // WHEN: The user clicks the "Done" checkbox again
        await user.click(doneCheckbox);

        // THEN: The filter is removed and all tasks are visible
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.getByText('Design database schema')
          ).toBeInTheDocument();
        });
      });
      it('should combine filters from different facets (status and priority)', async () => {
        renderComponent(
          { projects: [project] },
          { tasks, currentProjectIdForTasks: 'proj-1' }
        );
        const toolbar = screen.getByRole('toolbar');

        // GIVEN: The user applies a status filter
        await user.click(
          within(toolbar).getByRole('button', { name: /status/i })
        );
        const doneCheckbox = await screen.findByRole('option', {
          name: /done/i,
        });
        await user.click(doneCheckbox);

        // AND: the user applies a priority filter
        await user.click(
          within(toolbar).getByRole('button', { name: /priority/i })
        );
        const highPriorityCheckbox = await screen.findByRole('option', {
          name: /high/i,
        });
        await user.click(highPriorityCheckbox);

        // THEN: Only the task matching both filters is visible
        await waitFor(() => {
          expect(screen.getByText('Implement login page')).toBeInTheDocument();
          expect(
            screen.queryByText('Design database schema')
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText('Implement user dashboard')
          ).not.toBeInTheDocument();
        });
      });
    });
  });

  // Test suite for accessibility (a11y) checks.
  describe('5. Accessibility', () => {
    let container;
    let project;
    let tasks;

    beforeEach(() => {
      project = createMockProject({ id: 'proj-1' });
      tasks = [
        createMockTask({
          id: 'task-1',
          title: 'Accessible Task',
          project_id: 'proj-1',
        }),
      ];
      ({ container } = renderComponent(
        { projects: [project] },
        { tasks, currentProjectIdForTasks: 'proj-1' }
      ));
    });

    it('should have no accessibility violations on initial render with tasks', async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when modals are open', async () => {
      await user.click(screen.getByRole('button', { name: /add task/i }));
      await screen.findByRole('dialog');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when a filter menu is open', async () => {
      const toolbar = screen.getByRole('toolbar');

      // GIVEN: the status filter menu is open
      await user.click(
        within(toolbar).getByRole('button', { name: /status/i })
      );
      await screen.findByRole('option', {
        name: /done/i,
      });

      // THEN: there should be no accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
