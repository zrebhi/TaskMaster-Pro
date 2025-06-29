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
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';

import ProjectTasksPage from '../../../pages/ProjectTasksPage';
import {
  createMockProject,
  createMockTask,
  waitForElementToBeRemoved,
  setupTest,
} from '../../helpers/test-utils';
import {
  TestProviders,
  createAuthenticatedContext,
  createMockProjectContext,
  createMockTaskContext,
  createMockErrorContext,
} from '../../helpers/mock-providers';

// Import the actual providers and contexts needed for the integration test
import { TaskProvider } from '../../../context/TaskContext';
import ProjectContext from '../../../context/ProjectContext';
import AuthContext from '../../../context/AuthContext';
import ErrorContext from '../../../context/ErrorContext';

// Mock the underlying API service to isolate the frontend.
jest.mock('../../../services/taskApiService');

/**
 * A custom render function for the ProjectTasksPage component.
 * It wraps the component with all necessary mock providers and a memory router.
 * This simplifies the setup for each test case.
 *
 * @param {object} projectContextOverrides - Overrides for the mock ProjectContext.
 * @param {object} taskContextOverrides - Overrides for the mock TaskContext.
 * @param {object} authContextOverrides - Overrides for the mock AuthContext.
 * @param {object} errorContextOverrides - Overrides for the mock ErrorContext.
 * @param {string} initialRoute - The initial route for the MemoryRouter.
 * @returns {import('@testing-library/react').RenderResult} The result of the RTL render.
 */
const renderComponent = (
  projectContextOverrides = {},
  taskContextOverrides = {},
  authContextOverrides = {},
  errorContextOverrides = {},
  initialRoute = '/projects/proj-1'
) => {
  const authValue = createAuthenticatedContext(authContextOverrides);
  const projectValue = createMockProjectContext(projectContextOverrides);
  const taskValue = createMockTaskContext(taskContextOverrides);
  const errorValue = createMockErrorContext(errorContextOverrides);

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TestProviders
        authValue={authValue}
        projectValue={projectValue}
        taskValue={taskValue}
        errorValue={errorValue}
      >
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
        </Routes>
      </TestProviders>
    </MemoryRouter>
  );
};

describe('Integration Test: ProjectTasksPage', () => {
  let user;
  let cleanup;

  beforeEach(() => {
    // setupTest mocks console.error and handles cleanup
    ({ cleanup } = setupTest());
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  // Test suite for the initial rendering and data states of the page.
  describe('1. Initial Render & Data States', () => {
    it('should display a loading indicator when isLoadingTasks is true', () => {
      const project = createMockProject({ id: 'proj-1' });
      renderComponent(
        { projects: [project], isLoading: false },
        { isLoadingTasks: true }
      );
      expect(screen.getByText(/loading tasks.../i)).toBeInTheDocument();
    });

    it('should display an error message when taskError has a value', () => {
      const project = createMockProject({ id: 'proj-1' });
      renderComponent(
        { projects: [project], isLoading: false },
        { taskError: 'Failed to fetch tasks.' }
      );
      expect(screen.getByText(/failed to fetch tasks/i)).toBeInTheDocument();
    });

    it('should render the list of tasks provided by the context on a successful load', () => {
      const project = createMockProject({ id: 'proj-1' });
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
      renderComponent(
        { projects: [project], isLoading: false },
        { tasks, isLoadingTasks: false, currentProjectIdForTasks: 'proj-1' }
      );
      expect(screen.getByText(/first task/i)).toBeInTheDocument();
      expect(screen.getByText(/second task/i)).toBeInTheDocument();
    });

    it('should display an empty state message if no tasks are provided', () => {
      const project = createMockProject({ id: 'proj-1' });
      renderComponent(
        { projects: [project], isLoading: false },
        { tasks: [], isLoadingTasks: false }
      );
      expect(
        screen.getByRole('heading', { name: /you have no task/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/get started by creating a new task/i)
      ).toBeInTheDocument();
    });
  });

  // Test suite for all Create, Read, Update, and Delete (CRUD) operations,
  // including the modal interactions involved in these flows.
  describe('2. Row Actions & Modal Flows', () => {
    const project = createMockProject({ id: 'proj-1' });
    const task = createMockTask({
      id: 'task-1',
      title: 'Task to be Edited',
      project_id: 'proj-1',
    });

    it('should open the Edit Task modal when the "Edit" action is clicked on a task row', async () => {
      renderComponent(
        { projects: [project] },
        { tasks: [task], currentProjectIdForTasks: 'proj-1' }
      );

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
      renderComponent(
        { projects: [project] },
        { tasks: [task], currentProjectIdForTasks: 'proj-1' }
      );

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
      renderComponent(
        { projects: [project] },
        { tasks: [task], currentProjectIdForTasks: 'proj-1' }
      );

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
      const { rerender } = renderComponent(
        { projects: [project] },
        {
          tasks: [task],
          deleteTask: deleteTaskMock,
          currentProjectIdForTasks: 'proj-1',
        }
      );

      // Action: Click delete and confirm
      const row = screen.getByText(task.title).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );
      await user.click(await screen.findByRole('button', { name: /delete/i }));

      // Assertion: Mock function was called
      expect(deleteTaskMock).toHaveBeenCalledWith(task.id);

      // Simulate the context update by re-rendering with the new state
      rerender(
        <MemoryRouter initialEntries={['/projects/proj-1']}>
          <TestProviders
            authValue={createAuthenticatedContext()}
            projectValue={createMockProjectContext({ projects: [project] })}
            taskValue={createMockTaskContext({
              tasks: [],
              deleteTask: deleteTaskMock,
              currentProjectIdForTasks: 'proj-1',
            })}
            errorValue={createMockErrorContext()}
          >
            <Routes>
              <Route
                path="/projects/:projectId"
                element={<ProjectTasksPage />}
              />
            </Routes>
          </TestProviders>
        </MemoryRouter>
      );

      // Assertion: Task is removed from the UI
      await waitFor(() => {
        expect(screen.queryByText(task.title)).not.toBeInTheDocument();
      });
    });

    it('should display a toast notification if the deleteTask context function throws an error', async () => {
      // 1. Setup Mocks
      /**
       * @typedef {Error & { processedError: { message: string, severity: string } }} TestError
       */
      const error = /** @type {TestError} */ (new Error('Deletion Failed'));
      error.processedError = {
        message: 'API Error: Could not delete',
        severity: 'high',
      };

      // Mock the underlying API service calls
      const {
        deleteTaskById,
        getTasksForProjectAPI,
      } = require('../../../services/taskApiService');
      /** @type {jest.Mock} */ (deleteTaskById).mockRejectedValue(error);
      // Mock the initial fetch that happens in the real TaskProvider
      /** @type {jest.Mock} */ (getTasksForProjectAPI).mockResolvedValue([
        task,
      ]);

      const showErrorToastMock = jest.fn();

      // 2. Render with the REAL TaskProvider.
      // This is necessary to test the actual error handling logic within the TaskContext,
      // which is not possible when providing a mocked context value via `renderComponent`.
      // By building the provider tree manually, we ensure that the component uses the
      // real TaskProvider, which will catch the rejected promise from the mocked API service.
      const authValue = createAuthenticatedContext({});
      const projectValue = createMockProjectContext({
        projects: [project],
        isLoading: false,
      });
      const errorValue = createMockErrorContext({
        showErrorToast: showErrorToastMock,
      });

      render(
        <MemoryRouter initialEntries={['/projects/proj-1']}>
          <AuthContext.Provider value={authValue}>
            <ErrorContext.Provider value={errorValue}>
              <ProjectContext.Provider value={projectValue}>
                <TaskProvider>
                  <Routes>
                    <Route
                      path="/projects/:projectId"
                      element={<ProjectTasksPage />}
                    />
                  </Routes>
                </TaskProvider>
              </ProjectContext.Provider>
            </ErrorContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // 3. Perform the user action
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
        expect(showErrorToastMock).toHaveBeenCalledWith(error.processedError);
      });

      // Task should still be visible because the deletion failed
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });

    it('should update the task in the table after a successful edit', async () => {
      // 1. Setup Mocks
      const updateTaskMock = jest.fn().mockResolvedValue({});
      const updatedTask = { ...task, title: 'An Edited Task Title' };

      const { rerender } = renderComponent(
        { projects: [project] },
        {
          tasks: [task],
          updateTask: updateTaskMock,
          currentProjectIdForTasks: 'proj-1',
        }
      );

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
      rerender(
        <MemoryRouter initialEntries={['/projects/proj-1']}>
          <TestProviders
            authValue={createAuthenticatedContext()}
            projectValue={createMockProjectContext({ projects: [project] })}
            taskValue={createMockTaskContext({
              tasks: [updatedTask], // Use the updated task
              updateTask: updateTaskMock,
              currentProjectIdForTasks: 'proj-1',
            })}
            errorValue={createMockErrorContext()}
          >
            <Routes>
              <Route
                path="/projects/:projectId"
                element={<ProjectTasksPage />}
              />
            </Routes>
          </TestProviders>
        </MemoryRouter>
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
      const project = createMockProject({ id: 'proj-1' });

      // Test 1: The "Happy Path"
      it('should call updateTask, apply a line-through style, and update the action text when a task is marked as complete', async () => {
        // GIVEN: An incomplete task and a mock update function
        const incompleteTask = createMockTask({
          id: 'task-complete-1',
          title: 'Finish the report',
          is_completed: false,
          project_id: 'proj-1',
        });
        const updateTaskMock = jest.fn().mockResolvedValue({});
        const updatedTask = { ...incompleteTask, is_completed: true };

        const { rerender } = renderComponent(
          { projects: [project] },
          {
            tasks: [incompleteTask],
            updateTask: updateTaskMock,
            currentProjectIdForTasks: 'proj-1',
          }
        );

        // WHEN: The user marks the task as complete
        const row = screen.getByText(incompleteTask.title).closest('tr');
        await user.click(
          within(row).getByRole('button', { name: /open menu/i })
        );
        await user.click(
          await screen.findByRole('menuitem', { name: /mark as complete/i })
        );

        // THEN: The context function is called correctly
        await waitFor(() => {
          expect(updateTaskMock).toHaveBeenCalledWith(incompleteTask.id, {
            is_completed: true,
          });
        });

        // AND: The UI updates after the state changes (simulated via rerender)
        rerender(
          <MemoryRouter initialEntries={['/projects/proj-1']}>
            <TestProviders
              authValue={createAuthenticatedContext()}
              projectValue={createMockProjectContext({ projects: [project] })}
              taskValue={createMockTaskContext({
                tasks: [updatedTask], // Simulate the state update
                updateTask: updateTaskMock,
                currentProjectIdForTasks: 'proj-1',
              })}
              errorValue={createMockErrorContext()}
            >
              <Routes>
                <Route
                  path="/projects/:projectId"
                  element={<ProjectTasksPage />}
                />
              </Routes>
            </TestProviders>
          </MemoryRouter>
        );

        expect(row).toHaveAttribute('data-completed', 'true');
        expect(within(row).getByText('Done')).toBeInTheDocument();

        // Assert the behavioral text change
        await user.click(
          within(row).getByRole('button', { name: /open menu/i })
        );
        expect(
          await screen.findByRole('menuitem', { name: /mark as incomplete/i })
        ).toBeInTheDocument();
      });

      // Test 2: The "Reverse Path"
      it('should correctly mark a completed task as incomplete', async () => {
        // GIVEN: A completed task
        const completedTask = createMockTask({
          id: 'task-uncomplete-1',
          title: 'A finished task',
          is_completed: true,
          project_id: 'proj-1',
        });
        const updateTaskMock = jest.fn().mockResolvedValue({});

        renderComponent(
          { projects: [project] },
          {
            tasks: [completedTask],
            updateTask: updateTaskMock,
            currentProjectIdForTasks: 'proj-1',
          }
        );

        // WHEN: The user marks the task as incomplete
        const row = screen.getByText(completedTask.title).closest('tr');
        await user.click(
          within(row).getByRole('button', { name: /open menu/i })
        );
        await user.click(
          await screen.findByRole('menuitem', { name: /mark as incomplete/i })
        );

        // THEN: The context function is called with the correct payload
        await waitFor(() => {
          expect(updateTaskMock).toHaveBeenCalledWith(completedTask.id, {
            is_completed: false,
          });
        });
      });

      // Test 3: The "Failure Path"
      it('should display a toast notification and not change the UI if marking a task as complete fails', async () => {
        // GIVEN: The API is mocked to fail, and we are using the REAL TaskProvider
        const error = new Error('Update Failed');
        error.processedError = {
          message: 'API Error: Could not update',
          severity: 'high',
        };
        const {
          updateTaskDetails, // This is the function we need to mock now
          getTasksForProjectAPI,
        } = require('../../../services/taskApiService');
        /** @type {jest.Mock} */ (updateTaskDetails).mockRejectedValue(error);
        const task = createMockTask({
          id: 'task-fail-1',
          title: 'Task that will fail',
          is_completed: false,
          project_id: 'proj-1',
        });
        /** @type {jest.Mock} */ (getTasksForProjectAPI).mockResolvedValue([
          task,
        ]);

        const showErrorToastMock = jest.fn();

        // Render with the real provider to test the real error handling logic
        render(
          <MemoryRouter initialEntries={['/projects/proj-1']}>
            <AuthContext.Provider value={createAuthenticatedContext()}>
              <ErrorContext.Provider
                value={createMockErrorContext({
                  showErrorToast: showErrorToastMock,
                })}
              >
                <ProjectContext.Provider
                  value={createMockProjectContext({ projects: [project] })}
                >
                  <TaskProvider>
                    <Routes>
                      <Route
                        path="/projects/:projectId"
                        element={<ProjectTasksPage />}
                      />
                    </Routes>
                  </TaskProvider>
                </ProjectContext.Provider>
              </ErrorContext.Provider>
            </AuthContext.Provider>
          </MemoryRouter>
        );

        // WHEN: The user tries to mark the task as complete
        const row = (await screen.findByText(task.title)).closest('tr');
        await user.click(
          within(row).getByRole('button', { name: /open menu/i })
        );
        await user.click(
          await screen.findByRole('menuitem', { name: /mark as complete/i })
        );

        // THEN: A toast notification is shown
        await waitFor(() => {
          expect(showErrorToastMock).toHaveBeenCalledWith(error.processedError);
        });

        // AND: The UI has NOT changed
        const titleSpan = screen.getByText(task.title);
        expect(titleSpan).not.toHaveClass('line-through'); // Check style for absence

        // Check data-attribute for state
        const taskRow = screen.getByText(task.title).closest('tr');
        expect(taskRow).toHaveAttribute('data-completed', 'false');
        expect(within(taskRow).getByText('To Do')).toBeInTheDocument();
      });
    });
  });

  // Test suite for the "Add Task" flow.
  describe('3. Add Task Flow', () => {
    const project = createMockProject({ id: 'proj-1' });

    it('should open the Add Task modal when the "Add Task" button is clicked', async () => {
      renderComponent({ projects: [project] }, { tasks: [] });
      await user.click(screen.getByRole('button', { name: /add task/i }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /create new task/i })
      ).toBeInTheDocument();
    });

    it('should call the addTask context function when the add task form is submitted successfully', async () => {
      const addTaskMock = jest
        .fn()
        .mockResolvedValue(createMockTask({ id: 'new-task' }));
      renderComponent(
        { projects: [project] },
        { tasks: [], addTask: addTaskMock }
      );

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

      const { rerender } = renderComponent(
        { projects: [project] },
        { tasks: [], addTask: addTaskMock }
      );
      await user.click(screen.getByRole('button', { name: /add task/i }));
      await user.type(
        await screen.findByLabelText(/task title/i),
        newTask.title
      );
      await user.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => expect(addTaskMock).toHaveBeenCalled());

      // Re-render with the new task to simulate context update
      rerender(
        <MemoryRouter initialEntries={['/projects/proj-1']}>
          <TestProviders
            authValue={createAuthenticatedContext()}
            projectValue={createMockProjectContext({ projects: [project] })}
            taskValue={createMockTaskContext({
              tasks: [newTask],
              currentProjectIdForTasks: 'proj-1',
            })}
            errorValue={createMockErrorContext()}
          >
            <Routes>
              <Route
                path="/projects/:projectId"
                element={<ProjectTasksPage />}
              />
            </Routes>
          </TestProviders>
        </MemoryRouter>
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
          expect(screen.getByText('Design database schema')).toBeInTheDocument();
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
          expect(screen.getByText('Design database schema')).toBeInTheDocument();
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
          expect(screen.getByText('Design database schema')).toBeInTheDocument();
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
