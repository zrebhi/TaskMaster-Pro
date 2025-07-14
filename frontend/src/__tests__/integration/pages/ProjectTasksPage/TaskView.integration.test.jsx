import {
  createMockProject,
  createMockTask,
  createMockApiError, // We'll need this for the failure path
} from '@/__tests__/helpers/test-utils';
import {
  setupPageTests,
  renderTaskPageWithProvider,
  taskApiService,
  screen,
  within,
  waitFor,
  axe,
} from './ProjectTasksPage.TestSetup';

describe('Integration Test: TaskDetailSheet', () => {
  let user;
  let queryClient;
  let project;

  const testState = setupPageTests();

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
    project = createMockProject({ id: 'proj-1', name: 'Test Project' });
    jest.clearAllMocks();
  });

  describe('1. Read Path: Opening, Closing, and Data Rendering', () => {
    it('should fetch tasks, open the sheet with correct data, be accessible, and close properly', async () => {
      // Arrange
      const task = createMockTask({
        id: 'task-1',
        title: 'Review Final Proposal',
        description: 'Check the budget and timeline sections.',
        priority: 3,
        due_date: '2025-12-25T00:00:00.000Z',
        is_completed: false,
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);

      const { container } = renderTaskPageWithProvider(queryClient, {
        projects: [project],
        initialRoute: `/projects/${project.id}`,
      });

      // Act
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));
      const titleButton = within(row).getByRole('button', { name: task.title });
      await user.click(titleButton);

      // Assert
      const sheet = await screen.findByRole('dialog', { name: task.title });
      expect(sheet).toBeVisible();
      expect(
        within(sheet).getByRole('heading', { name: task.title })
      ).toBeInTheDocument();
      expect(within(sheet).getByText(/to do/i)).toBeInTheDocument();
      expect(within(sheet).getByText(/high/i)).toBeInTheDocument();
      expect(within(sheet).getByText(/december 25, 2025/i)).toBeInTheDocument();
      expect(within(sheet).getByText(task.description)).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('2. Success Path: Primary Actions', () => {
    // Helper function to open the detail sheet for a given task
    const openTaskSheet = async (taskTitle) => {
      const row = await screen
        .findByText(taskTitle)
        .then((el) => el.closest('tr'));
      const titleButton = within(row).getByRole('button', { name: taskTitle });
      await user.click(titleButton);
      return screen.findByRole('dialog', { name: taskTitle });
    };

    it('should mark a task as complete, update the UI, and call the API', async () => {
      // Arrange
      const task = createMockTask({
        id: 'task-complete',
        title: 'Task to Complete',
        is_completed: false,
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);
      taskApiService.patchTaskAPI.mockResolvedValue({
        ...task,
        is_completed: true,
      });

      renderTaskPageWithProvider(queryClient, { projects: [project] });

      // Act
      const sheet = await openTaskSheet(task.title);
      await user.click(
        within(sheet).getByRole('button', { name: /mark complete/i })
      );

      // Assert
      await waitFor(() => {
        expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(task.id, {
          is_completed: true,
        });
      });
      expect(
        await within(sheet).findByRole('button', { name: /mark incomplete/i })
      ).toBeInTheDocument();
      expect(within(sheet).getByText(/Done/i)).toBeInTheDocument();
    });

    it('should open the edit form when "Edit" is clicked', async () => {
      // Arrange
      const task = createMockTask({
        id: 'task-edit',
        title: 'Task to Edit',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);
      renderTaskPageWithProvider(queryClient, { projects: [project] });

      // Act
      const detailSheet = await openTaskSheet(task.title);
      await user.click(
        within(detailSheet).getByRole('button', { name: /edit/i })
      );

      // Assert
      const editDialog = await screen.findByRole('dialog', {
        name: /edit task/i,
      });
      expect(editDialog).toBeVisible();
      // Verify the original sheet is gone
      expect(
        screen.queryByRole('dialog', { name: task.title })
      ).not.toBeInTheDocument();
    });

    it('should open the delete confirmation when "Delete" is clicked', async () => {
      // Arrange
      const task = createMockTask({
        id: 'task-delete',
        title: 'Task to Delete',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);
      renderTaskPageWithProvider(queryClient, { projects: [project] });

      // Act
      const detailSheet = await openTaskSheet(task.title);
      await user.click(
        within(detailSheet).getByRole('button', { name: /delete/i })
      );

      // Assert
      const deleteDialog = await screen.findByRole('dialog', {
        name: /delete task/i,
      });
      expect(deleteDialog).toBeVisible();

      const expectedMessage = new RegExp(
        `Are you sure you want to delete the task "${task.title}"\\?`,
        'i'
      );
      expect(
        within(deleteDialog).getByText(expectedMessage)
      ).toBeInTheDocument();
    });
  });

  describe('3. Failure Path: API Error Handling', () => {
    it('should show an error toast and revert optimistic UI on a failed update', async () => {
      // Arrange
      const task = createMockTask({
        id: 'task-fail',
        title: 'Task that Will Fail',
        is_completed: false,
        project_id: 'proj-1',
      });
      const apiError = createMockApiError(500, 'The server is on fire!');
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);
      taskApiService.patchTaskAPI.mockRejectedValue(apiError);
      const showErrorToastMock = jest.fn();

      renderTaskPageWithProvider(queryClient, {
        projects: [project],
        errorContext: { showErrorToast: showErrorToastMock },
        initialRoute: `/projects/${project.id}`,
      });

      // Act
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));
      const titleButton = within(row).getByRole('button', { name: task.title });
      await user.click(titleButton);
      const sheet = await screen.findByRole('dialog', { name: task.title });

      // Before clicking, verify the initial state
      expect(
        within(sheet).getByRole('button', { name: /mark complete/i })
      ).toBeInTheDocument();

      await user.click(
        within(sheet).getByRole('button', { name: /mark complete/i })
      );

      // Assert
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'The server is on fire!',
            statusCode: 500,
          })
        );
      });

      // Assert UI reverted. The button text is back to "Mark Complete" and status is "To Do".
      expect(
        within(sheet).getByRole('button', { name: /mark complete/i })
      ).toBeInTheDocument();
      expect(within(sheet).getByText(/to do/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /mark incomplete/i })
      ).not.toBeInTheDocument();
      expect(within(sheet).queryByText(/Done/i)).not.toBeInTheDocument();
    });
  });
});
