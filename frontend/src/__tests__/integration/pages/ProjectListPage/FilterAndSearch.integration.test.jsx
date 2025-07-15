/**
 * @file Integration tests for the filtering and searching functionality on the ProjectListPage.
 */
import '@testing-library/jest-dom';

// Import from our new, centralized setup files
import {
  screen,
  waitFor,
  within,
  projectApiService,
  renderProjectListPage,
} from './ProjectListPage.TestSetup';
import { setupPageTests } from '@/__tests__/helpers/integration-test-utils';

import { createMockProject } from '@/__tests__/helpers/test-utils';

describe('ProjectListPage: Filter and Search', () => {
  // Use the shared setup hook
  const testState = setupPageTests();

  // Common set of projects used across tests for consistency.
  const projects = [
    createMockProject({ id: 'proj-alpha', name: 'Project Alpha' }),
    createMockProject({ id: 'proj-beta', name: 'Project Beta' }),
    createMockProject({ id: 'proj-omega', name: 'Omega Initiative' }),
  ];

  // No more beforeEach mock! Mocks should be scenario-specific.
  // This aligns with "Keep Mocks Local and Scenario-Specific" from your principles.

  it('should filter the table to show only projects matching the search term', async () => {
    // Arrange
    projectApiService.getAllProjects.mockResolvedValue(projects); // Mock inside the test!
    const { user } = testState;
    renderProjectListPage(testState.queryClient);

    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act
    await user.type(searchInput, 'Alpha');

    // Assert
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Project Alpha')).toBeInTheDocument();
      expect(within(table).queryByText('Project Beta')).not.toBeInTheDocument();
      expect(
        within(table).queryByText('Omega Initiative')
      ).not.toBeInTheDocument();
    });
  });

  it('should display a "No results." message when the search term finds no matches', async () => {
    // Arrange
    projectApiService.getAllProjects.mockResolvedValue(projects);
    const { user } = testState;
    renderProjectListPage(testState.queryClient);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act
    await user.type(searchInput, 'Zebra');

    // Assert
    await waitFor(() => {
      expect(screen.getByText('No results.')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });
  });

  it('should restore the full list of projects when the search filter is cleared', async () => {
    // Arrange
    projectApiService.getAllProjects.mockResolvedValue(projects);
    const { user } = testState;
    renderProjectListPage(testState.queryClient);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act 1: Filter
    await user.type(searchInput, 'Omega');
    await screen.findByText('Omega Initiative');
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();

    // Act 2: Clear
    await user.clear(searchInput);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Omega Initiative')).toBeInTheDocument();
    });
  });

  it('should match projects in a case-insensitive manner', async () => {
    // Arrange
    projectApiService.getAllProjects.mockResolvedValue(projects);
    const { user } = testState;
    renderProjectListPage(testState.queryClient);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act
    await user.type(searchInput, 'project beta');

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });
  });
});
