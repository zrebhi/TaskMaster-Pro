/**
 * @file Accessibility tests for the ProjectTasksPage.
 * This suite uses jest-axe to ensure the page and its interactive
 * elements (modals, menus) have no accessibility violations.
 */
import {
  setupPageTests,
  renderProjectTasksPage,
  taskApiService,
  screen,
  within,
  axe,
} from './ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
} from '@/__tests__/helpers/test-utils';

// Define mock data at the top level for reuse
const mockProject = createMockProject({
  id: 'proj-1',
  name: 'Accessibility Project',
});

describe('ProjectTasksPage - Accessibility', () => {
  let user;
  let queryClient;
  const testState = setupPageTests();

  const tasks = [
    createMockTask({
      id: 'task-1',
      project_id: 'proj-1',
      title: 'A visible task',
    }),
  ];

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
  });

  it('should have no accessibility violations on initial render with tasks', async () => {
    // ARRANGE
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    const { container } = renderProjectTasksPage(queryClient, {
      projects: [mockProject],
    });

    // ACT: Wait for the page to finish loading and display the task
    await screen.findByText('A visible task');

    // ASSERT: Check for accessibility violations
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when the "Add Task" modal is open', async () => {
    // ARRANGE: Start with an empty task list for simplicity
    taskApiService.getTasksForProjectAPI.mockResolvedValue([]);
    const { container } = renderProjectTasksPage(queryClient, {
      projects: [mockProject],
    });

    // Wait for the page to be ready (e.g., the Add Task button is present)
    const addTaskButton = await screen.findByRole('button', {
      name: /add task/i,
    });

    // ACT: Open the modal
    await user.click(addTaskButton);
    await screen.findByRole('dialog', { name: /create new task/i });

    // ASSERT: Check for accessibility violations with the modal open
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when a filter menu is open', async () => {
    // ARRANGE
    taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    const { container } = renderProjectTasksPage(queryClient, {
      projects: [mockProject],
    });

    // Wait for the toolbar to be ready
    const toolbar = await screen.findByRole('toolbar');

    // ACT: Open the status filter menu
    await user.click(within(toolbar).getByRole('button', { name: /status/i }));
    // ASSERT: Wait for a user-observable *outcome* to appear, not the container.
    await screen.findByRole('option', { name: /done/i });

    // ASSERT: Check for accessibility violations with the menu open
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
