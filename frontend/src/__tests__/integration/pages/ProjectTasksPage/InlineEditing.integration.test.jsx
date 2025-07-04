// @ts-check
/**
 * @file Integration tests for inline editing features on the ProjectTasksPage.
 */

import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import {
  renderWithRealTaskProvider, // Use the real provider for all tests to ensure correct prop drilling
} from '@/__tests__/helpers/ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
  createMockApiError,
} from '@/__tests__/helpers/test-utils';

// Mock the entire service layer to isolate the frontend.
jest.mock('@/services/taskApiService');

// After mocking, we can import the specific functions to control their behavior.
const {
  patchTaskAPI,
  getTasksForProjectAPI,
} = require('@/services/taskApiService');

const mockedPatchTaskAPI = /** @type {jest.Mock} */ (patchTaskAPI);
const mockedGetTasksForProjectAPI = /** @type {jest.Mock} */ (
  getTasksForProjectAPI
);

describe('Inline Priority Editing', () => {
  let user;
  const project = createMockProject({ id: 'proj-1' });
  const task = createMockTask({
    id: 'task-prio-1',
    title: 'Task for priority editing',
    priority: 2, // Corresponds to "Medium"
    project_id: 'proj-1',
  });

  beforeEach(() => {
    user = userEvent.setup();
    // Reset mocks to a clean state before each test.
    jest.clearAllMocks();
  });

  it('should display the new priority after it has been changed and saved (Success Path)', async () => {
    // Arrange
    mockedPatchTaskAPI.mockResolvedValue({ ...task, priority: 3 });
    mockedGetTasksForProjectAPI.mockResolvedValue([task]);

    renderWithRealTaskProvider({ projects: [project], isLoading: false });

    const row = (await screen.findByText(task.title)).closest('tr');
    const priorityTrigger = within(row).getByText('Medium');

    // Act
    await user.click(priorityTrigger);
    const highOption = await screen.findByText('High');
    await user.click(highOption);

    // Assert
    // 1. Verify the correct service layer contract was used.
    await waitFor(() => {
      expect(mockedPatchTaskAPI).toHaveBeenCalledWith(task.id, { priority: 3 });
    });

    // 2. Verify the UI reflects the change.
    await waitFor(() => {
      expect(within(row).getByText('High')).toBeInTheDocument();
    });
    expect(within(row).queryByText('Medium')).not.toBeInTheDocument();
  });

  it('should show an error toast and not change the displayed priority if saving fails (Failure Path)', async () => {
    // Arrange
    const error = createMockApiError(
      500,
      'Could not save new priority',
      'high'
    );

    mockedPatchTaskAPI.mockRejectedValue(error);
    mockedGetTasksForProjectAPI.mockResolvedValue([task]);
    const showErrorToastMock = jest.fn();

    renderWithRealTaskProvider(
      { projects: [project], isLoading: false },
      { showErrorToast: showErrorToastMock }
    );
    const row = (await screen.findByText(task.title)).closest('tr');
    const priorityTrigger = within(row).getByText('Medium');

    // Act
    await user.click(priorityTrigger);
    const highOption = await screen.findByText('High');
    await user.click(highOption);

    // Assert
    await waitFor(() => {
      expect(showErrorToastMock).toHaveBeenCalledWith(
        /** @type {any} */ (error).processedError
      );
    });
    expect(within(row).getByText('Medium')).toBeInTheDocument();
    expect(within(row).queryByText('High')).not.toBeInTheDocument();
  });

  it('should not save a change and should revert to display mode when Escape is pressed (Reversal Path)', async () => {
    // Arrange
    mockedGetTasksForProjectAPI.mockResolvedValue([task]);
    renderWithRealTaskProvider({ projects: [project], isLoading: false });

    const row = (await screen.findByText(task.title)).closest('tr');
    const priorityTrigger = within(row).getByText('Medium');

    // Act
    await user.click(priorityTrigger);
    await screen.findByText('Low');
    await user.keyboard('{escape}');

    // Assert
    expect(within(row).getByText('Medium')).toBeInTheDocument();
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(mockedPatchTaskAPI).not.toHaveBeenCalled();
  });
});

describe('Inline Due Date Editing', () => {
  let user;
  const project = createMockProject({ id: 'proj-1' });
  const originalDate = Date;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    // Fix the current date to ensure the calendar is consistent across test runs
    const fixedDate = new Date('2024-06-15T00:00:00.000Z'); // Set to midnight UTC to avoid timezone issues

    // @ts-ignore - Mocking the global Date object for test consistency
    global.Date = class extends originalDate {
      constructor(...args) {
        // If called with arguments, pass them to the real Date constructor.
        // If called with no arguments (`new Date()`), use our fixed date.
        if (args.length > 0) {
          // @ts-ignore - Spreading args on a constructor with multiple overloads is not type-safe.
          super(...args);
        } else {
          super(fixedDate);
        }
      }
    };
  });

  afterEach(() => {
    // Restore the original Date object
    global.Date = originalDate;
  });

  describe('Success Path', () => {
    it('should set a new date for a task that has no due date', async () => {
      // Arrange
      const taskWithoutDate = createMockTask({
        id: 'task-date-1',
        title: 'Task without a due date',
        due_date: null,
        project_id: 'proj-1',
      });
      mockedPatchTaskAPI.mockResolvedValue({
        ...taskWithoutDate,
        due_date: '2024-06-25',
      });
      mockedGetTasksForProjectAPI.mockResolvedValue([taskWithoutDate]);

      renderWithRealTaskProvider({ projects: [project] });

      const row = (await screen.findByText(taskWithoutDate.title)).closest(
        'tr'
      );
      const dateTrigger = within(row).getByRole('button', {
        name: /change due date for .* current: N\/A/i,
      });

      // Act
      await user.click(dateTrigger);
      const dayToSelect = await screen.findByText('25');
      await user.click(dayToSelect);

      // Assert
      await waitFor(() => {
        expect(mockedPatchTaskAPI).toHaveBeenCalledWith(taskWithoutDate.id, {
          due_date: '2024-06-25',
        });
      });

      // UI should now display the new date. 'toLocaleDateString' for 'en-US' locale.
      await waitFor(() => {
        expect(within(row).getByText('6/25/2024')).toBeInTheDocument();
      });
    });

    it('should clear an existing due date', async () => {
      // Arrange
      const taskWithDate = createMockTask({
        id: 'task-date-2',
        title: 'Task with a due date',
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      mockedPatchTaskAPI.mockResolvedValue({ ...taskWithDate, due_date: null });
      mockedGetTasksForProjectAPI.mockResolvedValue([taskWithDate]);

      renderWithRealTaskProvider({ projects: [project] });

      const row = (await screen.findByText(taskWithDate.title)).closest('tr');
      const dateTrigger = within(row).getByRole('button', {
        name: /change due date for .* current: 6\/20\/2024/i,
      });

      // Act
      await user.click(dateTrigger);
      const clearButton = await screen.findByRole('button', {
        name: /clear due date/i,
      });
      await user.click(clearButton);

      // Assert
      await waitFor(() => {
        expect(mockedPatchTaskAPI).toHaveBeenCalledWith(taskWithDate.id, {
          due_date: null,
        });
      });
      await waitFor(() => {
        const updatedDateButton = within(row).getByRole('button', { name: /current: N\/A/i });
        expect(updatedDateButton).toBeInTheDocument();
      });
    });
  });

  describe('Failure Path', () => {
    it('should revert the UI and show a toast if clearing the date fails', async () => {
      // Arrange
      const taskWithDate = createMockTask({
        id: 'task-date-fail',
        title: 'Task that will fail',
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      const error = createMockApiError(500, 'Server is on fire', 'high');
      mockedPatchTaskAPI.mockRejectedValue(error);
      mockedGetTasksForProjectAPI.mockResolvedValue([taskWithDate]);
      const showErrorToastMock = jest.fn();

      renderWithRealTaskProvider(
        { projects: [project] },
        { showErrorToast: showErrorToastMock }
      );

      const row = (await screen.findByText(taskWithDate.title)).closest('tr');
      const dateTrigger = within(row).getByText('6/20/2024');

      // Act
      await user.click(dateTrigger);
      const clearButton = await screen.findByRole('button', {
        name: /clear due date/i,
      });
      await user.click(clearButton);

      // Assert
      // 1. UI optimistically updates
      await waitFor(() => {
        expect(within(row).getByText('N/A')).toBeInTheDocument();
      });

      // 2. After API failure, toast is shown
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          /** @type {any} */ (error).processedError
        );
      });

      // 3. UI reverts to original state
      await waitFor(() => {
        expect(within(row).getByText('6/20/2024')).toBeInTheDocument();
      });
    });
  });

  describe('Reversal Path', () => {
    it('should close the editor and not save changes when clicking outside', async () => {
      // Arrange
      const taskWithDate = createMockTask({
        id: 'task-date-cancel',
        title: 'Task to cancel editing',
        due_date: '2024-06-20T00:00:00.000Z',
        project_id: 'proj-1',
      });
      mockedGetTasksForProjectAPI.mockResolvedValue([taskWithDate]);

      renderWithRealTaskProvider({ projects: [project] });

      const row = (await screen.findByText(taskWithDate.title)).closest('tr');
      const dateTrigger = within(row).getByText('6/20/2024');

      // Act
      await user.click(dateTrigger);
      // Verify editor is open by checking for its unique button
      expect(
        await screen.findByRole('button', { name: /clear due date/i })
      ).toBeInTheDocument();
      // Use fireEvent for a generic 'mousedown' that the component's effect listens for.
      fireEvent.mouseDown(document.body);

      // Assert
      await waitFor(() => {
        // The editor's unique button is a good proxy for the editor itself
        expect(
          screen.queryByRole('button', { name: /clear due date/i })
        ).not.toBeInTheDocument();
      });
      // The original date should still be there
      expect(within(row).getByText('6/20/2024')).toBeInTheDocument();
      // No API call should have been made
      expect(mockedPatchTaskAPI).not.toHaveBeenCalled();
    });
  });
});
