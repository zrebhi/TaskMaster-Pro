//@ts-check
/**
 * @file Integration tests for the ProjectListPage component.
 *
 * This test suite covers the following user stories:
 * - Story 1: As a user, I want to see all my projects and receive clear feedback on the status of my data.
 * - Story 2: As a user, I want to create, update, and delete my projects.
 * - Story 3: As a user, I want to receive clear feedback if an action fails.
 * - Story 4: As a user, I want to select a project to see its tasks.
 * - Story 5: As a user, I want the interface to be accessible.
 */

import { screen, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';
import { QueryClientProvider } from '@tanstack/react-query';

import ProjectListPage from '@/pages/ProjectListPage';
import {
  setupTest,
  createMockProject,
  waitForElementToBeRemoved,
  createTestQueryClient,
} from '@/__tests__/helpers/test-utils';
import {
  TestProviders,
  createAuthenticatedContext,
  createMockProjectContext,
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';
import { ProjectProvider } from '@/context/ProjectContext';
import AuthContext from '@/context/AuthContext';
import ErrorContext from '@/context/ErrorContext';

// Mock the underlying API service to isolate the frontend.
jest.mock('@/services/projectApiService');
// Import the mocked service functions to control them in tests
const {
  getAllProjects,
  deleteProjectAPI,
} = require('@/services/projectApiService');

/**
 * A custom render function for the ProjectListPage component.
 * It wraps the component with all necessary mock providers and a memory router.
 * This simplifies the setup for each test case.
 *
 * @param {object} projectContextValue - The value for the mock ProjectContext.
 * @param {object} [authContextValue] - Optional value for the mock AuthContext.
 * @param {object} [errorContextValue] - Optional value for the mock ErrorContext.
 * @returns {import('@testing-library/react').RenderResult & { user: import('@testing-library/user-event').UserEvent, queryClient }}
 */
const renderComponent = (
  projectContextValue,
  authContextValue = createAuthenticatedContext(),
  errorContextValue = createMockErrorContext()
) => {
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();
  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TestProviders
          authValue={authContextValue}
          projectValue={projectContextValue}
          errorValue={errorContextValue}
        >
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            {/* Add a destination route to handle navigation from project links */}
            <Route
              path="/projects/:projectId"
              element={<div>Mock Project Tasks Page</div>}
            />
          </Routes>
        </TestProviders>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...renderResult, user, queryClient };
};

describe('Integration Test: ProjectListPage', () => {
  let cleanup;

  beforeEach(() => {
    // setupTest mocks console.error and handles cleanup
    ({ cleanup } = setupTest());
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Story 1: Viewing Projects', () => {
    it('should display a loading indicator while projects are being fetched', () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockReturnValue(new Promise(() => {})); // Pending promise
      const projectContextValue = createMockProjectContext();
      renderComponent(projectContextValue);

      expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
    });

    it('should display an error message if the projects fail to load', async () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockRejectedValue(
        new Error('Failed to fetch projects.')
      );
      const projectContextValue = createMockProjectContext();
      renderComponent(projectContextValue);

      // The component displays its own error message now.
      expect(
        await screen.findByText(/could not load projects/i)
      ).toBeInTheDocument();
    });

    it('should display an empty state if I have no projects', async () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([]); // Mock API returns empty array
      const projectContextValue = createMockProjectContext();
      renderComponent(projectContextValue);

      const heading = await screen.findByRole('heading', {
        name: /you have no projects/i,
      });
      expect(heading).toBeInTheDocument();

      const addProjectButton = within(heading.closest('div')).getByRole(
        'button',
        {
          name: /add project/i,
        }
      );
      expect(addProjectButton).toBeInTheDocument();
    });

    it('should display the list of projects in the data table on a successful load', async () => {
      const projects = [
        createMockProject({ id: '1', name: 'Project Alpha' }),
        createMockProject({ id: '2', name: 'Project Beta' }),
      ];
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue(projects);
      const projectContextValue = createMockProjectContext();

      renderComponent(projectContextValue);

      const table = await screen.findByRole('table');
      expect(table).toBeInTheDocument();
      expect(within(table).getByText(/project alpha/i)).toBeInTheDocument();
      expect(within(table).getByText(/project beta/i)).toBeInTheDocument();
    });
  });

  describe('Story 2: Managing Projects', () => {
    it("should redirect to the new project's task page after successful creation", async () => {
      const initialProjects = [
        createMockProject({ id: '1', name: 'Existing Project' }),
      ];
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue(initialProjects);

      const newProject = createMockProject({
        id: '2',
        name: 'A Brand New Project',
      });
      const addProjectMock = jest.fn().mockResolvedValue(newProject);
      const projectContextValue = createMockProjectContext({
        addProject: addProjectMock,
      });

      const { user } = renderComponent(projectContextValue);

      // Wait for initial projects to load before interacting.
      await screen.findByText('Existing Project');

      await user.click(screen.getByRole('button', { name: /add project/i }));
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('heading', { name: /create new project/i })
      ).toBeInTheDocument();

      await user.type(
        within(dialog).getByLabelText(/project name/i),
        newProject.name
      );
      await user.click(
        within(dialog).getByRole('button', { name: /create project/i })
      );

      await waitFor(() => {
        expect(addProjectMock).toHaveBeenCalledWith({ name: newProject.name });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/mock project tasks page/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should open the "Edit Project" modal with correct data, and update the project in the table after a successful edit', async () => {
      const projectToEdit = createMockProject({
        id: '1',
        name: 'Initial Project Name',
      });
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([projectToEdit]);

      const updatedProject = { ...projectToEdit, name: 'Updated Project Name' };
      const updateProjectMock = jest.fn().mockResolvedValue(updatedProject);
      const projectContextValue = createMockProjectContext({
        updateProject: updateProjectMock,
      });

      const { user, queryClient } = renderComponent(projectContextValue);

      const row = await screen.findByText(projectToEdit.name);
      await user.click(
        within(row.closest('tr')).getByRole('button', { name: /open menu/i })
      );
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      const dialog = await screen.findByRole('dialog');
      const nameInput = within(dialog).getByLabelText(/project name/i);
      expect(nameInput).toHaveValue(projectToEdit.name);

      await user.clear(nameInput);
      await user.type(nameInput, updatedProject.name);
      await user.click(
        within(dialog).getByRole('button', { name: /save changes/i })
      );

      await waitFor(() => {
        expect(updateProjectMock).toHaveBeenCalledWith(projectToEdit.id, {
          name: updatedProject.name,
        });
      });

      // To simulate the UI update, we mock the next API call and invalidate the cache.
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([updatedProject]);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Verify the UI has updated after the refetch.
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(
          within(table).getByText(updatedProject.name)
        ).toBeInTheDocument();
        expect(
          within(table).queryByText(projectToEdit.name)
        ).not.toBeInTheDocument();
      });
    });

    it('should open a confirmation modal, and remove the project from the table when deletion is confirmed', async () => {
      const projectToDelete = createMockProject({
        id: '1',
        name: 'Project To Delete',
      });
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([projectToDelete]);
      const deleteProjectMock = jest.fn().mockResolvedValue({});
      const projectContextValue = createMockProjectContext({
        deleteProject: deleteProjectMock,
      });

      const { user, queryClient } = renderComponent(projectContextValue);

      const row = await screen.findByText(projectToDelete.name);
      await user.click(
        within(row.closest('tr')).getByRole('button', { name: /open menu/i })
      );
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(deleteProjectMock).toHaveBeenCalledWith(projectToDelete.id);
      });

      // Simulate UI update by mocking the next fetch to return an empty list and invalidating the cache.
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([]);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Verify the project is removed from the UI
      await waitForElementToBeRemoved(() =>
        screen.queryByText(projectToDelete.name)
      );
      expect(screen.queryByText(projectToDelete.name)).not.toBeInTheDocument();
    });
  });

  describe('Story 3: Handling Failures', () => {
    it('should display a toast notification and not alter the UI if a CRUD operation fails', async () => {
      const projectToDelete = createMockProject({
        id: '1',
        name: 'Project To Delete',
      });
      const error = new Error('API deletion failed');
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([projectToDelete]);
      /** @type {jest.Mock} */
      (deleteProjectAPI).mockRejectedValue(error);

      const showErrorToastMock = jest.fn();
      const errorContextValue = createMockErrorContext({
        showErrorToast: showErrorToastMock,
      });
      const authContextValue = createAuthenticatedContext();
      const user = userEvent.setup();
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AuthContext.Provider value={authContextValue}>
              <ErrorContext.Provider value={errorContextValue}>
                <ProjectProvider>
                  <Routes>
                    <Route path="/" element={<ProjectListPage />} />
                  </Routes>
                </ProjectProvider>
              </ErrorContext.Provider>
            </AuthContext.Provider>
          </MemoryRouter>
        </QueryClientProvider>
      );

      const row = await screen.findByText(projectToDelete.name);
      await user.click(
        within(row.closest('tr')).getByRole('button', { name: /open menu/i })
      );
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith({
          message: 'Failed to delete project.',
          severity: 'medium',
        });
      });
      expect(screen.getByText(projectToDelete.name)).toBeInTheDocument();
    });
  });
  describe('Story 4: Navigating to a Project', () => {
    it('should navigate to the correct project tasks page when a project row is clicked', async () => {
      const project = createMockProject({
        id: 'proj-1',
        name: 'My Test Project',
      });
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([project]);
      const projectContextValue = createMockProjectContext();
      const { user } = renderComponent(projectContextValue);

      const projectRow = await screen.findByRole('row', {
        name: /my test project/i,
      });
      await user.click(projectRow);

      await waitFor(() => {
        expect(
          screen.getByText(/mock project tasks page/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Story 5: Accessibility', () => {
    it('should have no accessibility violations on initial render or when modals are open', async () => {
      const projects = [
        createMockProject({ id: '1', name: 'Accessible Project' }),
      ];
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue(projects);
      const projectContextValue = createMockProjectContext();
      const { container, user } = renderComponent(projectContextValue);

      // Wait for table to render
      await screen.findByRole('table');

      // 1. Check initial render
      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // 2. Check Add Project modal
      await user.click(screen.getByRole('button', { name: /add project/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
      await user.click(screen.getByRole('button', { name: /close/i }));

      // 3. Check Edit Project modal
      const row = screen.getByText(/accessible project/i).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // 4. Check Delete confirmation modal
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
