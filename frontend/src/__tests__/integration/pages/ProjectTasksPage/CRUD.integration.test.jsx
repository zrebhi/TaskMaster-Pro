import {
  // Import standard tools from the shared setup file
  setupPageTests,
  renderTaskPageWithProvider,
  taskApiService,
  screen,
  within,
  waitFor,
  waitForElementToBeRemoved,
  createMockApiError,
} from './ProjectTasksPage.TestSetup';
import {
  createMockTask,
  createMockProject,
} from '@/__tests__/helpers/test-utils';

// Define mock data at the top level for reuse across tests
const mockProject = createMockProject({ id: 'proj-1', name: 'Test Project' });

describe('ProjectTasksPage - CRUD Operations', () => {
  let user;
  let queryClient;

  // Use the standard setup to manage user events and the query client
  const testState = setupPageTests();

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
  });

  describe('2. Row Actions & Modal Flows', () => {
    const task = createMockTask({
      id: 'task-1',
      title: 'Task to be Edited',
      project_id: 'proj-1',
      is_completed: false,
    });

    // Helper to perform the common action of opening a row's action menu
    const openRowMenu = async (taskTitle) => {
      const row = await screen
        .findByText(taskTitle)
        .then((el) => el.closest('tr'));
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      return row;
    };

    it('should open the Edit Task modal and close it with Cancel', async () => {
      // ARRANGE
      const task = createMockTask({
        id: 'task-modal-test',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));

      // ACT (Open)
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

      // ASSERT (Open)
      const dialog = await screen.findByRole('dialog', { name: /edit task/i });
      expect(dialog).toBeVisible();

      // ACT (Close)
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      // ASSERT (Close)
      await waitForElementToBeRemoved(() => dialog);
    });

    it('should open the Delete confirmation modal and close it with Cancel', async () => {
      // ARRANGE
      const task = createMockTask({
        id: 'task-delete-confirm',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));

      // ACT
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );

      // ASSERT
      const dialog = await screen.findByRole('dialog', {
        name: /delete task/i,
      });
      expect(dialog).toBeVisible();
      const expectedMessage = new RegExp(
        `Are you sure you want to delete the task "${task.title}"\\?`
      );
      expect(within(dialog).getByText(expectedMessage)).toBeInTheDocument();

      // ACT (Close)
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      // ASSERT (Close)
      await waitForElementToBeRemoved(() => dialog);
    });

    it('should update the task in the table after a successful edit', async () => {
      // ARRANGE
      const updatedTitle = 'An Edited Task Title';
      const updatedTask = { ...task, title: updatedTitle };
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      // Mock the update API to return the modified task
      taskApiService.updateTaskAPI.mockResolvedValue(updatedTask);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

      // ACT
      await openRowMenu(task.title);
      await user.click(await screen.findByRole('menuitem', { name: /edit/i }));

      const dialog = await screen.findByRole('dialog', { name: /edit task/i });
      const titleInput = within(dialog).getByLabelText(/task title/i);
      await user.clear(titleInput);
      await user.type(titleInput, updatedTitle);
      await user.click(
        within(dialog).getByRole('button', { name: /save changes/i })
      );

      // ASSERT
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      expect(taskApiService.updateTaskAPI).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({ title: updatedTitle })
      );
      // Verify the UI updated with the new title
      expect(await screen.findByText(updatedTitle)).toBeInTheDocument();
      expect(screen.queryByText(task.title)).not.toBeInTheDocument();
    });

    it('should delete the task from the table after a successful confirmation', async () => {
      // ARRANGE
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      // Mock the delete API to resolve successfully
      taskApiService.deleteTaskAPI.mockResolvedValue({});
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

      // ACT
      await openRowMenu(task.title);
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );

      const dialog = await screen.findByRole('dialog', {
        name: /delete task/i,
      });
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      // ASSERT
      expect(taskApiService.deleteTaskAPI).toHaveBeenCalledWith(task.id);
      // Verify the task row is removed from the DOM
      await waitFor(() => {
        expect(screen.queryByText(task.title)).not.toBeInTheDocument();
      });
      // Verify the empty state appears
      expect(
        screen.getByRole('heading', { name: /you have no task/i })
      ).toBeInTheDocument();
    });

    it('should display a toast notification and not remove task if delete fails', async () => {
      // ARRANGE
      const apiError = createMockApiError(500, 'Could not delete');
      const showErrorToastMock = jest.fn();
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      taskApiService.deleteTaskAPI.mockRejectedValue(apiError);
      renderTaskPageWithProvider(queryClient, {
        projects: [mockProject],
        errorContext: { showErrorToast: showErrorToastMock },
      });

      // ACT
      await openRowMenu(task.title);
      await user.click(
        await screen.findByRole('menuitem', { name: /delete/i })
      );
      const dialog = await screen.findByRole('dialog', {
        name: /delete task/i,
      });
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      // ASSERT
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Could not delete' })
        );
      });
      // The task should still be visible in the table
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  });

  describe('3. Task Completion Flow', () => {
    it('should mark a task as complete, call the API, and update the UI', async () => {
      // ARRANGE
      const incompleteTask = createMockTask({
        id: 'task-c',
        title: 'A task to complete',
        is_completed: false,
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([incompleteTask]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });
      const row = await screen
        .findByText(incompleteTask.title)
        .then((el) => el.closest('tr'));

      const completedTask = { ...incompleteTask, is_completed: true };
      taskApiService.patchTaskAPI.mockResolvedValue(completedTask);
      taskApiService.getTasksForProjectAPI.mockResolvedValue([completedTask]);

      // ACT
      await user.click(
        within(row).getByRole('button', { name: /toggle status/i })
      );

      // ASSERT
      await waitFor(() => {
        expect(row).toHaveAttribute('data-completed', 'true');
        expect(within(row).getByText('Done')).toBeInTheDocument();
      });
      expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(
        incompleteTask.id,
        { is_completed: true }
      );
    });

    it('should mark a task as incomplete, call the API, and update the UI', async () => {
      // ARRANGE
      const completedTask = createMockTask({
        id: 'task-d',
        title: 'A task to un-complete',
        is_completed: true,
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([completedTask]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });
      const row = await screen
        .findByText(completedTask.title)
        .then((el) => el.closest('tr'));

      const incompleteTask = { ...completedTask, is_completed: false };
      taskApiService.patchTaskAPI.mockResolvedValue(incompleteTask);
      taskApiService.getTasksForProjectAPI.mockResolvedValue([incompleteTask]);

      // ACT
      await user.click(
        within(row).getByRole('button', { name: /toggle status/i })
      );

      // ASSERT
      await waitFor(() => {
        expect(row).toHaveAttribute('data-completed', 'false');
        expect(within(row).getByText('To Do')).toBeInTheDocument();
      });
      expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(
        completedTask.id,
        { is_completed: false }
      );
    });

    it('should display a toast and revert UI if the patch update fails', async () => {
      // ARRANGE
      const taskToFail = createMockTask({
        id: 'task-fail',
        is_completed: false,
        project_id: 'proj-1',
      });
      const apiError = createMockApiError(500, 'Server is down');
      const showErrorToastMock = jest.fn();

      taskApiService.getTasksForProjectAPI.mockResolvedValue([taskToFail]);
      renderTaskPageWithProvider(queryClient, {
        projects: [mockProject],
        errorContext: { showErrorToast: showErrorToastMock },
      });
      const row = await screen
        .findByText(taskToFail.title)
        .then((el) => el.closest('tr'));

      taskApiService.patchTaskAPI.mockRejectedValue(apiError);

      // ACT
      await user.click(
        within(row).getByRole('button', { name: /toggle status/i })
      );

      // ASSERT
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Server is down' })
        );
      });
      expect(row).toHaveAttribute('data-completed', 'false');
      expect(within(row).getByText('To Do')).toBeInTheDocument();
    });
  });

  describe('4. Add Task Flow', () => {
    it('should open the Add Task modal when the "Add Task" button is clicked', async () => {
      // ARRANGE
      taskApiService.getTasksForProjectAPI.mockResolvedValue([]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });

      // ACT
      const addTaskButton = await screen.findByRole('button', {
        name: /add task/i,
      });
      await user.click(addTaskButton);

      // ASSERT
      const dialog = await screen.findByRole('dialog', {
        name: /create new task/i,
      });
      expect(dialog).toBeVisible();
    });

    it('should add a new task to the table after successful form submission', async () => {
      // ARRANGE
      const newTask = createMockTask({
        id: 'new-task',
        title: 'A brand new task',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([]);
      renderTaskPageWithProvider(queryClient, { projects: [mockProject] });
      expect(
        await screen.findByRole('heading', { name: /you have no task/i })
      ).toBeInTheDocument();

      taskApiService.createTaskInProjectAPI.mockResolvedValue(newTask);
      taskApiService.getTasksForProjectAPI.mockResolvedValue([newTask]); // For re-fetch

      // ACT
      await user.click(
        await screen.findByRole('button', { name: /add task/i })
      );
      const dialog = await screen.findByRole('dialog', {
        name: /create new task/i,
      });
      await user.type(
        within(dialog).getByLabelText(/task title/i),
        newTask.title
      );
      await user.click(
        within(dialog).getByRole('button', { name: /create task/i })
      );

      // ASSERT
      expect(await screen.findByText(newTask.title)).toBeInTheDocument();
      expect(taskApiService.createTaskInProjectAPI).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({ title: newTask.title })
      );
    });
  });
});
