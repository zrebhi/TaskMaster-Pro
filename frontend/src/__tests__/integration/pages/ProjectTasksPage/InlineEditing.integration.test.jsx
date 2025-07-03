// @ts-check
/**
 * @file Integration tests for inline editing features on the ProjectTasksPage.
 */

import { screen, within, waitFor } from '@testing-library/react';
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
const mockedGetTasksForProjectAPI =
  /** @type {jest.Mock} */ (getTasksForProjectAPI);

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
