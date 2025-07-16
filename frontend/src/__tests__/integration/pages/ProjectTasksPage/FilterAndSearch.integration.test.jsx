/**
 * @file Integration tests for filtering and searching on the ProjectTasksPage.
 * This suite focuses on the text search and its interaction with faceted filters.
 */

import {
  // Import from our centralized, modern test setup
  setupPageTests,
  renderProjectTasksPage,
  taskApiService,
  projectApiService,
  screen,
  waitFor,
  within,
} from './ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
} from '@/__tests__/helpers/test-utils';


const mockProject = createMockProject({ id: 'proj-1' });
projectApiService.getAllProjects.mockResolvedValue([mockProject]);

describe('ProjectTasksPage: Filter and Search', () => {
  let user;
  let queryClient;
  const testState = setupPageTests();

  beforeEach(() => {

    user = testState.user;
    queryClient = testState.queryClient;
  });

  // Helper to wait for the initial task list to be visible
  const waitForTasksToLoad = async (taskTitles) => {
    for (const title of taskTitles) {
      await screen.findByText(title);
    }
  };

  it('should filter tasks by title using the text input (Smoke Test)', async () => {
    // ARRANGE: Mock the API to return a specific set of tasks
    const tasks = [
      createMockTask({
        id: 'task-login',
        title: 'Implement login page',
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-db',
        title: 'Design database schema',
        project_id: 'proj-1',
      }),
    ];
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    renderProjectTasksPage(queryClient);
    await waitForTasksToLoad([
      'Implement login page',
      'Design database schema',
    ]);

    // ACT
    const searchInput = screen.getByPlaceholderText('Search by task title...');
    await user.type(searchInput, 'database');

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Design database schema')).toBeInTheDocument();
    });
    expect(screen.queryByText('Implement login page')).not.toBeInTheDocument();
  });

  it('should apply the text search on top of results already filtered by a facet', async () => {
    // ARRANGE: Mock the API with tasks of different statuses
    const tasks = [
      createMockTask({
        id: 'task-dash-impl',
        title: 'Implement user dashboard', // To Do
        is_completed: false,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-dash-review',
        title: 'Review dashboard design', // Done
        is_completed: true,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-login-fix',
        title: 'Fix login button', // Done
        is_completed: true,
        project_id: 'proj-1',
      }),
    ];
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    renderProjectTasksPage(queryClient);
    await waitForTasksToLoad([
      'Implement user dashboard',
      'Review dashboard design',
      'Fix login button',
    ]);
    const toolbar = screen.getByRole('toolbar');

    // ACT 1: Apply the "Status" facet filter
    await user.click(within(toolbar).getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /done/i }));

    // ASSERT 1: The list is filtered by the facet
    await waitFor(() => {
      expect(
        screen.queryByText('Implement user dashboard')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Review dashboard design')).toBeInTheDocument();
    expect(screen.getByText('Fix login button')).toBeInTheDocument();

    // ACT 2: Apply the text search on the filtered results
    const searchInput = screen.getByPlaceholderText('Search by task title...');
    await user.type(searchInput, 'dashboard');

    // ASSERT 2: The list is now filtered by both facet and text
    await waitFor(() => {
      expect(screen.queryByText('Fix login button')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Review dashboard design')).toBeInTheDocument();
  });

  it('should clear both text and facet filters when the "Reset" button is clicked', async () => {
    // ARRANGE
    const tasks = [
      createMockTask({
        title: 'Task A',
        is_completed: true, // Done
        project_id: 'proj-1',
      }),
      createMockTask({
        title: 'Task B',
        is_completed: false, // To Do
        project_id: 'proj-1',
      }),
    ];
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    renderProjectTasksPage(queryClient);
    await waitForTasksToLoad(['Task A', 'Task B']);
    const toolbar = screen.getByRole('toolbar');

    // ACT 1: Apply both filters
    await user.click(within(toolbar).getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /done/i }));
    const searchInput = screen.getByPlaceholderText('Search by task title...');
    await user.type(searchInput, 'Task A'); // Be more specific to ensure filtering

    // ASSERT 1: The list is filtered
    await waitFor(() => {
      expect(screen.queryByText('Task B')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Task A')).toBeInTheDocument();

    // ACT 2: Click the "Reset" button
    const resetButton = within(toolbar).getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    // ASSERT 2: All filters are cleared and all tasks are visible
    await waitFor(() => {
      expect(searchInput).toHaveValue(''); // The search input is cleared
    });
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
  });
});
