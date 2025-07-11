// @ts-check
/**
 * @file Integration tests for the filtering and searching functionality on the ProjectListPage.
 * @see {@link ../../../../../TestingGuidingPrinciples.md}
 */

import { screen, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import ProjectListPage from '@/pages/ProjectListPage';
import { createMockProject, createTestQueryClient } from '@/__tests__/helpers/test-utils';
import {
  TestProviders,
  createAuthenticatedContext,
  createMockProjectContext,
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';

// The service is mocked to ensure isolation.
jest.mock('@/services/projectApiService');
// We need to import the mocked service to control its behavior during tests.
const { getAllProjects } = require('@/services/projectApiService');

/**
 * A custom render function for the ProjectListPage component.
 * It wraps the component with all necessary mock providers and a memory router.
 *
 * @param {object} projectContextValue - The value for the mock ProjectContext.
 * @returns {import('@testing-library/react').RenderResult & { user: import('@testing-library/user-event').UserEvent }}
 */
const renderComponent = (projectContextValue) => {
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();
  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TestProviders
          authValue={createAuthenticatedContext()}
          projectValue={projectContextValue}
          errorValue={createMockErrorContext()}
        >
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
          </Routes>
        </TestProviders>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...renderResult, user };
};

describe('ProjectListPage: Filter and Search', () => {
  // Common set of projects used across tests for consistency.
  const projects = [
    createMockProject({ id: 'proj-alpha', name: 'Project Alpha' }),
    createMockProject({ id: 'proj-beta', name: 'Project Beta' }),
    createMockProject({ id: 'proj-omega', name: 'Omega Initiative' }),
  ];

  // This context is still needed as ProjectListPage uses it for mutations (e.g., deleteProject).
  const projectContextValue = createMockProjectContext({
    projects: [], // This is no longer used by the component to render the list.
    isLoading: false,
    error: null,
  });

  beforeEach(() => {
    // Mock the API call that the `useProjects` hook will make on render.
    /** @type {jest.Mock} */
    (getAllProjects).mockResolvedValue(projects);
  });

  it('should filter the table to show only projects matching the search term', async () => {
    // Arrange
    const { user } = renderComponent(projectContextValue);
    // Data is now fetched asynchronously, so wait for it to appear.
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act
    await user.type(searchInput, 'Alpha');

    // Assert
    await waitFor(() => {
      const table = screen.getByRole('table');
      // The matching project should be visible.
      expect(within(table).getByText('Project Alpha')).toBeInTheDocument();
      // The non-matching projects should be gone.
      expect(within(table).queryByText('Project Beta')).not.toBeInTheDocument();
      expect(
        within(table).queryByText('Omega Initiative')
      ).not.toBeInTheDocument();
    });
  });

  it('should display a "No results." message when the search term finds no matches', async () => {
    // Arrange
    const { user } = renderComponent(projectContextValue);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act
    await user.type(searchInput, 'Zebra');

    // Assert
    await waitFor(() => {
      // The key assertion is that the "No results" message is shown.
      expect(screen.getByText('No results.')).toBeInTheDocument();
      // We can also confirm none of the original rows are present.
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });
  });

  it('should restore the full list of projects when the search filter is cleared', async () => {
    // Arrange
    const { user } = renderComponent(projectContextValue);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // First, filter the list to a subset.
    await user.type(searchInput, 'Omega');
    await waitFor(() => {
      expect(screen.getByText('Omega Initiative')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });

    // Act
    await user.clear(searchInput);

    // Assert
    await waitFor(() => {
      // All original projects should be visible again.
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Omega Initiative')).toBeInTheDocument();
    });
  });

  it('should match projects in a case-insensitive manner', async () => {
    // Arrange
    const { user } = renderComponent(projectContextValue);
    const searchInput = await screen.findByPlaceholderText(
      'Search by project title...'
    );

    // Act: Type the search term in all lowercase.
    await user.type(searchInput, 'project beta');

    // Assert
    await waitFor(() => {
      // The row with "Project Beta" should be found.
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      // The others should be filtered out.
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Omega Initiative')).not.toBeInTheDocument();
    });
  });
});
