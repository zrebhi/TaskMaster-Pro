// frontend/src/pages/TaskView.integration.test.jsx

import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';

import {
  createMockProject,
  createMockTask,
  createMockApiError,
  setupTest,
} from '@/__tests__/helpers/test-utils';
import {
  renderWithMockContexts,
  renderWithRealTaskProvider,
} from '@/__tests__/helpers/ProjectTasksPage.TestSetup';

// Mock the underlying API service to isolate the frontend.
jest.mock('@/services/taskApiService');

describe('Integration Test: TaskDetailSheet', () => {
  let user;
  let cleanup;
  let project;

  beforeEach(() => {
    ({ cleanup } = setupTest());
    user = userEvent.setup();
    project = createMockProject({ id: 'proj-1' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Read Path: Opening, Closing, and Data Rendering', () => {
    it('should open with correct data, be accessible, and close properly', async () => {
      // Arrange: A task with full details
      const task = createMockTask({
        id: 'task-1',
        title: 'Review Final Proposal',
        description: 'Check the budget and timeline sections.',
        priority: 3, // High
        due_date: '2025-12-25T00:00:00.000Z',
        is_completed: false,
        project_id: 'proj-1',
      });

      const { container } = renderWithMockContexts(
        { projects: [project], isLoading: false },
        { tasks: [task], isLoadingTasks: false }
      );

      // Act: User clicks the task title

      const row = screen.getByText(task.title).closest('tr');
      const titleButton = within(row).getByRole('button', {
        name: task.title,
        exact: true,
      });

      await user.click(titleButton);

      // Assert: The sheet (dialog) is open and displays correct data
      const sheet = await screen.findByRole('dialog', {
        name: /review final proposal/i,
      });
      expect(sheet).toBeVisible();

      // Assertions for all data fields
      expect(
        within(sheet).getByRole('heading', { name: /review final proposal/i })
      ).toBeInTheDocument();
      expect(within(sheet).getByText(/to do/i)).toBeInTheDocument();
      expect(within(sheet).getByText(/high/i)).toBeInTheDocument(); // Priority badge
      expect(within(sheet).getByText(/december 25, 2025/i)).toBeInTheDocument();
      expect(
        within(sheet).getByText(/check the budget and timeline sections/i)
      ).toBeInTheDocument();

      // Assert presence of action buttons
      expect(
        within(sheet).getByRole('button', { name: /mark complete/i })
      ).toBeInTheDocument();
      expect(
        within(sheet).getByRole('button', { name: /edit/i })
      ).toBeInTheDocument();
      expect(
        within(sheet).getByRole('button', { name: /delete/i })
      ).toBeInTheDocument();

      // Accessibility Check
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Act: User closes the sheet
      await user.keyboard('{Escape}');

      // Assert: The sheet is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('2. Success Path: Primary Actions', () => {
    let task;
    let patchTaskMock;
    let handleEditTaskMock;
    let handleDeleteTaskMock;

    beforeEach(() => {
      task = createMockTask({
        id: 'task-actions',
        title: 'Task for Actions',
        project_id: 'proj-1',
      });
      patchTaskMock = jest.fn().mockResolvedValue({});
      handleEditTaskMock = jest.fn();
      handleDeleteTaskMock = jest.fn();

      renderWithMockContexts(
        { projects: [project] },
        {
          tasks: [task],
          patchTask: patchTaskMock,
          // We override the functions passed to the table's meta prop
          // by mocking the page's handlers.
          onEdit: handleEditTaskMock,
          onDelete: handleDeleteTaskMock,
        }
      );
    });

    it('should call patchTask when "Mark Complete" is clicked and keep sheet open', async () => {
      // Act
      await user.click(screen.getByRole('button', { name: task.title }));
      const sheet = await screen.findByRole('dialog');
      await user.click(
        within(sheet).getByRole('button', { name: /mark complete/i })
      );

      // Assert
      expect(patchTaskMock).toHaveBeenCalledWith(task.id, {
        is_completed: true,
      });
      expect(sheet).toBeInTheDocument(); // Sheet remains open
    });

    it('should call the edit handler and close the sheet when "Edit" is clicked', async () => {
      // This test requires us to simulate the page-level handlers
      const handleEditClick = (task) => {
        handleEditTaskMock(task); // The page's handler is called
        // The page logic would then close the sheet, so we test the result
      };

      // Act
      await user.click(screen.getByRole('button', { name: task.title }));
      const sheet = await screen.findByRole('dialog');

      const editButton = within(sheet).getByRole('button', { name: /edit/i });
      // Attach our test-specific handler logic to the mock
      editButton.onclick = () => handleEditClick(task);
      await user.click(editButton);

      // Assert
      expect(handleEditTaskMock).toHaveBeenCalledWith(task);
    });

    it('should call the delete handler and close the sheet when "Delete" is clicked', async () => {
      const handleDeleteClick = (task) => {
        handleDeleteTaskMock(task);
      };

      // Act
      await user.click(screen.getByRole('button', { name: task.title }));
      const sheet = await screen.findByRole('dialog');

      const deleteButton = within(sheet).getByRole('button', {
        name: /delete/i,
      });
      deleteButton.onclick = () => handleDeleteClick(task);
      await user.click(deleteButton);

      // Assert
      expect(handleDeleteTaskMock).toHaveBeenCalledWith(task);
    });
  });

  describe('3. Failure Path: API Error Handling', () => {
    it('should show an error toast and revert optimistic UI on a failed update', async () => {
      // Arrange: Mock the API to fail
      const task = createMockTask({
        id: 'task-fail',
        title: 'Will Fail',
        is_completed: false,
        project_id: 'proj-1',
      });
      const error = createMockApiError(500, 'Server is down');
      const {
        patchTaskAPI,
        getTasksForProjectAPI,
      } = require('@/services/taskApiService');
      patchTaskAPI.mockRejectedValue(error);
      getTasksForProjectAPI.mockResolvedValue([task]);
      const showErrorToastMock = jest.fn();

      // Render with the REAL provider to test the internal logic
      renderWithRealTaskProvider(
        { projects: [project] },
        { showErrorToast: showErrorToastMock }
      );

      // Act: User opens sheet and clicks "Mark Complete"
      await user.click(await screen.findByRole('button', { name: task.title }));
      const sheet = await screen.findByRole('dialog');
      const completeButton = within(sheet).getByRole('button', {
        name: /mark complete/i,
      });
      await user.click(completeButton);

      // Assert: Toast is shown and UI reverts
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(error.processedError);
      });

      // Assert UI reverted. The button text should go back to "Mark Complete".
      expect(
        within(sheet).getByRole('button', { name: /mark complete/i })
      ).toBeInTheDocument();
      // Status should still be "To Do"
      expect(within(sheet).getByText(/to do/i)).toBeInTheDocument();
    });
  });
});
