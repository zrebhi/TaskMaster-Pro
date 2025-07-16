/**
 * @file Integration tests for inline editing features on the ProjectTasksPage.
 */

import {
  // Import from our modern, shared test setup
  setupPageTests,
  renderProjectTasksPage,
  taskApiService,
  projectApiService,
  screen,
  within,
  waitFor,
  fireEvent,
} from './ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
  createMockApiError,
} from '@/__tests__/helpers/test-utils';

// The API service is mocked in the shared setup file.

const mockProject = createMockProject({ id: 'proj-1' });
projectApiService.getAllProjects.mockResolvedValue([mockProject]);

describe('Inline Priority Editing', () => {
  let user;
  let queryClient;
  const testState = setupPageTests();
  const task = createMockTask({
    id: 'task-prio-1',
    title: 'Task for priority editing',
    priority: 2, // Corresponds to "Medium"
    project_id: 'proj-1',
  });

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
    // Reset mocks to a clean state before each test.
    jest.clearAllMocks();
  });

  it('should display the new priority after it has been changed and saved (Success Path)', async () => {
    // ARRANGE: Mock API responses
    taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([task]);
    const patchedTask = {...task, priority: 3};
    taskApiService.patchTaskAPI.mockResolvedValue(patchedTask);
    taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([patchedTask]);

    renderProjectTasksPage(queryClient);
    const row = await screen
      .findByText(task.title)
      .then((el) => el.closest('tr'));
    const priorityTrigger = within(row).getByText('Medium');

    // ACT
    await user.click(priorityTrigger);
    const highOption = await screen.findByRole('option', { name: 'High' });
    await user.click(highOption);

    // ASSERT
    // 1. Verify the correct API call was made.
    await waitFor(() => {
      expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(task.id, {
        priority: 3,
      });
    });

    // 2. Verify the UI reflects the change based on user-visible text.
    expect(await within(row).findByText('High')).toBeInTheDocument();
    expect(within(row).queryByText('Medium')).not.toBeInTheDocument();
  });

  it('should show an error toast and not change the displayed priority if saving fails (Failure Path)', async () => {
    // ARRANGE
    const error = createMockApiError(500, 'Could not save new priority');
    const showErrorToastMock = jest.fn();
    taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
    taskApiService.patchTaskAPI.mockRejectedValue(error);

    renderProjectTasksPage(queryClient, {
      errorContext: { showErrorToast: showErrorToastMock },
    });
    const row = await screen
      .findByText(task.title)
      .then((el) => el.closest('tr'));
    const priorityTrigger = within(row).getByText('Medium');

    // ACT
    await user.click(priorityTrigger);
    const highOption = await screen.findByRole('option', { name: 'High' });
    await user.click(highOption);

    // ASSERT
    await waitFor(() => {
      expect(showErrorToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Could not save new priority' })
      );
    });
    expect(within(row).getByText('Medium')).toBeInTheDocument();
    expect(within(row).queryByText('High')).not.toBeInTheDocument();
  });

  it('should not save a change and should revert to display mode when Escape is pressed (Reversal Path)', async () => {
    // ARRANGE
    taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
    renderProjectTasksPage(queryClient);
    const row = await screen
      .findByText(task.title)
      .then((el) => el.closest('tr'));
    const priorityTrigger = within(row).getByText('Medium');

    // ACT
    await user.click(priorityTrigger);
    await screen.findByRole('option', { name: 'Low' }); // Wait for menu to be open
    await user.keyboard('{escape}');

    // ASSERT
    // The menu should be gone, but the original value remains.
    expect(
      screen.queryByRole('option', { name: 'Low' })
    ).not.toBeInTheDocument();
    expect(within(row).getByText('Medium')).toBeInTheDocument();
    expect(taskApiService.patchTaskAPI).not.toHaveBeenCalled();
  });
});

describe('Inline Due Date Editing', () => {
  let user;
  let queryClient;
  const testState = setupPageTests();
  const mockProject = createMockProject({ id: 'proj-1' });
  const originalDate = Date;

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
    jest.clearAllMocks();
    // Fix the current date to ensure getToday() is consistent.
    const fixedDate = new Date('2024-06-15T12:00:00.000Z');
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length > 0) {
          // @ts-ignore
          super(...args);
        } else {
          return fixedDate;
        }
      }
      static now() {
        return fixedDate.getTime();
      }
    };
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('Success Path', () => {
    it('should set a new date for a task that has no due date', async () => {
      // ARRANGE
      const taskWithoutDate = createMockTask({
        id: 'task-date-1',
        due_date: null,
        project_id: 'proj-1',
      });
      const taskWithDate = {
        ...taskWithoutDate,
        due_date: '2024-06-25T00:00:00.000Z',
      };

      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([
        taskWithoutDate,
      ]);
      taskApiService.patchTaskAPI.mockResolvedValue({
        ...taskWithoutDate,
        due_date: '2024-06-25T00:00:00.000Z',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([
        taskWithDate,
      ]);
      renderProjectTasksPage(queryClient);
      const row = await screen
        .findByText(taskWithoutDate.title)
        .then((el) => el.closest('tr'));
      const dateTrigger = within(row).getByRole('button', {
        name: /current: n\/a/i,
      });

      // ACT
      await user.click(dateTrigger);
      const dateInput = await screen.findByLabelText(/edit due date/i);
      fireEvent.change(dateInput, { target: { value: '2024-06-25' } });
      fireEvent.blur(dateInput);

      // ASSERT
      await waitFor(() => {
        expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(
          taskWithoutDate.id,
          {
            due_date: '2024-06-25',
          }
        );
      });
      expect(await within(row).findByText('6/25/2024')).toBeInTheDocument();
    });

    it('should clear an existing due date', async () => {
      // ARRANGE
      const taskWithDate = createMockTask({
        id: 'task-date-2',
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      const taskWithoutDate = createMockTask({
        id: 'task-date-2',
        due_date: null,
        project_id: 'proj-1',
      });

      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([
        taskWithDate,
      ]);
      taskApiService.patchTaskAPI.mockResolvedValue({
        ...taskWithDate,
        due_date: null,
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValueOnce([
        taskWithoutDate,
      ]);
      renderProjectTasksPage(queryClient);
      const row = await screen
        .findByText(taskWithDate.title)
        .then((el) => el.closest('tr'));
      const dateTrigger = within(row).getByRole('button', {
        name: /current: 6\/20\/2024/i,
      });

      // ACT
      await user.click(dateTrigger);
      const dateInput = await screen.findByLabelText(/edit due date/i);
      fireEvent.change(dateInput, { target: { value: '' } });
      fireEvent.blur(dateInput);

      // ASSERT
      await waitFor(() => {
        expect(taskApiService.patchTaskAPI).toHaveBeenCalledWith(
          taskWithDate.id,
          {
            due_date: null,
          }
        );
      });
      expect(
        await within(row).findByRole('button', { name: /current: n\/a/i })
      ).toBeInTheDocument();
    });
  });

  describe('Failure Path', () => {
    it('should revert UI and show a toast if saving fails', async () => {
      // ARRANGE
      const taskWithDate = createMockTask({
        id: 'task-date-fail',
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      const error = createMockApiError(500, 'Server is on fire');
      const showErrorToastMock = jest.fn();

      taskApiService.getTasksForProjectAPI.mockResolvedValue([taskWithDate]);
      taskApiService.patchTaskAPI.mockRejectedValue(error);
      renderProjectTasksPage(queryClient, {
        errorContext: { showErrorToast: showErrorToastMock },
      });
      const row = await screen
        .findByText(taskWithDate.title)
        .then((el) => el.closest('tr'));
      const dateTrigger = within(row).getByText('6/20/2024');

      // ACT
      await user.click(dateTrigger);
      const dateInput = await screen.findByLabelText(/edit due date/i);
      fireEvent.change(dateInput, { target: { value: '2024-06-25' } });
      fireEvent.blur(dateInput);

      // ASSERT
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Server is on fire' })
        );
      });
      expect(within(row).getByText('6/20/2024')).toBeInTheDocument();
      expect(screen.queryByLabelText(/edit due date/i)).not.toBeInTheDocument();
    });

    it('should show a validation error and not save if a past date is entered', async () => {
      // ARRANGE
      const task = createMockTask({
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      const showErrorToastMock = jest.fn();
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      renderProjectTasksPage(queryClient, {
        errorContext: { showErrorToast: showErrorToastMock },
      });
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));
      const dateTrigger = within(row).getByText('6/20/2024');

      // ACT
      await user.click(dateTrigger);
      const dateInput = await screen.findByLabelText(/edit due date/i);
      // Mocked "today" is June 15th, so June 14th is in the past.
      fireEvent.change(dateInput, { target: { value: '2024-06-14' } });
      fireEvent.blur(dateInput);

      // ASSERT
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith({
          message: 'The due date cannot be in the past.',
          severity: 'low',
        });
      });
      expect(within(row).getByText('6/20/2024')).toBeInTheDocument();
      expect(screen.queryByLabelText(/edit due date/i)).not.toBeInTheDocument();
      expect(taskApiService.patchTaskAPI).not.toHaveBeenCalled();
    });
  });

  describe('Reversal Path', () => {
    it('should close the editor and not save when Escape is pressed', async () => {
      // ARRANGE
      const task = createMockTask({
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue([task]);
      renderProjectTasksPage(queryClient);
      const row = await screen
        .findByText(task.title)
        .then((el) => el.closest('tr'));
      const dateTrigger = within(row).getByText('6/20/2024');

      // ACT
      await user.click(dateTrigger);
      const dateInput = await screen.findByLabelText(/edit due date/i);
      fireEvent.change(dateInput, { target: { value: '2024-06-25' } });
      await user.keyboard('{escape}');

      // ASSERT
      expect(screen.queryByLabelText(/edit due date/i)).not.toBeInTheDocument();
      expect(within(row).getByText('6/20/2024')).toBeInTheDocument();
      expect(taskApiService.patchTaskAPI).not.toHaveBeenCalled();
    });
  });
});
