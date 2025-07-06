// @ts-check
/**
 * @file Integration tests for filtering and searching on the ProjectTasksPage.
 * This suite focuses on the text search and its interaction with faceted filters.
 * @see {@link ../../../../../TestingGuidingPrinciples.md}
 */

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { renderWithMockContexts } from '@/__tests__/helpers/ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
} from '@/__tests__/helpers/test-utils';

// The service is not directly used by this component (it relies on context),
// but it's good practice to mock it to ensure isolation.
jest.mock('@/services/taskApiService');

describe('ProjectTasksPage: Filter and Search', () => {
  let user;
  const project = createMockProject({ id: 'proj-1' });

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should filter tasks by title using the text input (Smoke Test)', async () => {
    // Arrange
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
    renderWithMockContexts(
      { projects: [project], isLoading: false },
      { tasks, isLoadingTasks: false, currentProjectIdForTasks: 'proj-1' }
    );

    const searchInput = screen.getByPlaceholderText('Search by task title...');

    // Act
    await user.type(searchInput, 'database');

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Design database schema')).toBeInTheDocument();
      expect(
        screen.queryByText('Implement login page')
      ).not.toBeInTheDocument();
    });
  });

  it('should apply the text search on top of results already filtered by a facet', async () => {
    // Arrange
    const tasks = [
      createMockTask({
        id: 'task-dash-impl',
        title: 'Implement user dashboard',
        is_completed: false, // Status: To Do
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-dash-review',
        title: 'Review dashboard design',
        is_completed: true, // Status: Done
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-login-fix',
        title: 'Fix login button',
        is_completed: true, // Status: Done
        project_id: 'proj-1',
      }),
    ];
    renderWithMockContexts(
      { projects: [project] },
      { tasks, currentProjectIdForTasks: 'proj-1' }
    );
    const toolbar = screen.getByRole('toolbar');

    // Act 1: Apply the "Status" facet filter
    await user.click(within(toolbar).getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /done/i }));

    // Assert 1: The list is filtered by the facet
    await waitFor(() => {
      expect(screen.getByText('Review dashboard design')).toBeInTheDocument();
      expect(screen.getByText('Fix login button')).toBeInTheDocument();
      expect(
        screen.queryByText('Implement user dashboard')
      ).not.toBeInTheDocument();
    });

    // Act 2: Apply the text search on the filtered results
    const searchInput = screen.getByPlaceholderText('Search by task title...');
    await user.type(searchInput, 'dashboard');

    // Assert 2: The list is now filtered by both facet and text
    await waitFor(() => {
      expect(screen.getByText('Review dashboard design')).toBeInTheDocument();
      expect(screen.queryByText('Fix login button')).not.toBeInTheDocument();
    });
  });

  it('should clear both text and facet filters when the "Reset" button is clicked', async () => {
    // Arrange
    const tasks = [
      createMockTask({
        title: 'Task A',
        is_completed: true, // Status: Done
        project_id: 'proj-1',
      }),
      createMockTask({
        title: 'Task B',
        is_completed: false, // Status: To Do
        project_id: 'proj-1',
      }),
    ];
    renderWithMockContexts(
      { projects: [project] },
      { tasks, currentProjectIdForTasks: 'proj-1' }
    );
    const toolbar = screen.getByRole('toolbar');

    // Act 1: Apply both filters
    await user.click(within(toolbar).getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /done/i }));
    const searchInput = screen.getByPlaceholderText('Search by task title...');
    await user.type(searchInput, 'Task');

    // Assert 1: The list is filtered
    await waitFor(() => {
      expect(screen.getByText('Task A')).toBeInTheDocument();
      expect(screen.queryByText('Task B')).not.toBeInTheDocument();
    });

    // Act 2: Click the "Reset" button
    const resetButton = within(toolbar).getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    // Assert 2: All filters are cleared and all tasks are visible
    await waitFor(() => {
      expect(searchInput).toHaveValue(''); // The search input is cleared
      expect(screen.getByText('Task A')).toBeInTheDocument();
      expect(screen.getByText('Task B')).toBeInTheDocument();
    });
  });
});
