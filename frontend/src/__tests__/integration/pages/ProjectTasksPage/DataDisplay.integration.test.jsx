import {
  setupPageTests,
  renderTaskPageWithProvider,
  taskApiService,
  screen,
} from './ProjectTasksPage.TestSetup';
import {
  createMockTask,
  createMockProject,
} from '@/__tests__/helpers/test-utils';

// Define a default project that matches the test route's projectId ('proj-1')
const mockProject = createMockProject({
  id: 'proj-1',
  name: 'Test Project Name',
});

describe('1. Initial Render & Data States', () => {
  // Use the standard setup to manage the query client and other test utilities
  let queryClient;
  const testState = setupPageTests();

  beforeEach(() => {
    queryClient = testState.queryClient;
  });

  // BEHAVIORAL TEST: Verifies the UI state while the API call is in-flight.
  it('should display a loading indicator while tasks are being fetched', async () => {
    // ARRANGE: Mock the API to be in a pending state by returning a never-resolving promise.
    // This simulates a network request that is still in progress.
    taskApiService.getTasksForProjectAPI.mockReturnValue(new Promise(() => {}));
    renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

    // ASSERT: The user sees a loading message. `findBy` is used to wait for it to appear.
    expect(await screen.findByText(/loading tasks.../i)).toBeInTheDocument();
  });

  // BEHAVIORAL TEST: Verifies the UI state when the API call fails.
  it('should display an error message if fetching tasks fails', async () => {
    // ARRANGE: Mock the API call to reject with an error.
    const errorMessage = 'Failed to fetch tasks.';
    taskApiService.getTasksForProjectAPI.mockRejectedValue(
      new Error(errorMessage)
    );
    renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

    // ASSERT: The user sees the corresponding error message after the fetch fails.
    expect(
      await screen.findByText(new RegExp(errorMessage, 'i'))
    ).toBeInTheDocument();
  });

  // BEHAVIORAL TEST (Success Path): Verifies the UI when the API returns data.
  it('should render the list of tasks on a successful fetch', async () => {
    // ARRANGE: Create mock tasks and mock the API to successfully return them.
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
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

    // ASSERT: The user sees the task titles rendered in the document.
    expect(await screen.findByText(/first task/i)).toBeInTheDocument();
    expect(screen.getByText(/second task/i)).toBeInTheDocument();
  });

  // BEHAVIORAL TEST (Success Path): Verifies the UI when the API returns no data.
  it('should display an empty state message if no tasks are returned', async () => {
    // ARRANGE: Mock the API to successfully return an empty array.
    taskApiService.getTasksForProjectAPI.mockResolvedValue([]);
    renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

    // ASSERT: The user sees the "no tasks" empty state heading.
    expect(
      await screen.findByRole('heading', { name: /you have no task/i })
    ).toBeInTheDocument();
  });
});
