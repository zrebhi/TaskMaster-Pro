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

import ProjectListPage from '@/pages/ProjectListPage';
import {
  setupTest,
  createMockProject,
  waitForElementToBeRemoved,
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


/**
 * A custom render function for the ProjectListPage component.
 * It wraps the component with all necessary mock providers and a memory router.
 * This simplifies the setup for each test case.
 *
 * @param {object} projectContextValue - The value for the mock ProjectContext.
 * @param {object} [authContextValue] - Optional value for the mock AuthContext.
 * @param {object} [errorContextValue] - Optional value for the mock ErrorContext.
 * @returns {import('@testing-library/react').RenderResult & { user: import('@testing-library/user-event').UserEvent }}
 */
const renderComponent = (
  projectContextValue,
  authContextValue = createAuthenticatedContext(),
  errorContextValue = createMockErrorContext()
) => {
  const user = userEvent.setup();
  const renderResult = render(
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
  );
  return { ...renderResult, user };
};

describe('Integration Test: ProjectListPage', () => {
  let cleanup;

  beforeEach(() => {
    // setupTest mocks console.error and handles cleanup
    ({ cleanup } = setupTest());
  });

  afterEach(() => {
    cleanup();
  });

  describe('Story 1: Viewing Projects', () => {
    it('should display a loading indicator while projects are being fetched', () => {
      const projectContextValue = createMockProjectContext({
        projects: [],
        isLoading: true,
        error: null,
      });

      renderComponent(projectContextValue);

      expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
    });

    it('should display an error message if the projects fail to load', () => {
      const projectContextValue = createMockProjectContext({
        projects: [],
        isLoading: false,
        error: 'Failed to fetch projects.',
      });

      renderComponent(projectContextValue);

      expect(
        screen.getByText(/failed to fetch projects./i)
      ).toBeInTheDocument();
    });

    it('should display an empty state if I have no projects', () => {
      const projectContextValue = createMockProjectContext({
        projects: [],
        isLoading: false,
        error: null,
      });

      renderComponent(projectContextValue);

      const heading = screen.getByRole('heading', {
        name: /you have no projects/i,
      });
      expect(heading).toBeInTheDocument();

      // The most important element is the call-to-action button.
      // This is less brittle than testing the descriptive text.
      const addProjectButton = within(heading.closest('div')).getByRole(
        'button',
        {
          name: /add project/i,
        }
      );
      expect(addProjectButton).toBeInTheDocument();
    });

    it('should display the list of projects in the data table on a successful load', () => {
      const projects = [
        createMockProject({ id: '1', name: 'Project Alpha' }),
        createMockProject({ id: '2', name: 'Project Beta' }),
      ];
      const projectContextValue = createMockProjectContext({
        projects,
        isLoading: false,
        error: null,
      });

      renderComponent(projectContextValue);

      // Check for the table and rows, which is more robust than checking for specific text.
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check for the project names within the table rows.
      // Using `within` scopes the search to the table, making it more reliable.
      expect(within(table).getByText(/project alpha/i)).toBeInTheDocument();
      expect(within(table).getByText(/project beta/i)).toBeInTheDocument();
    });
  });

  describe('Story 2: Managing Projects', () => {
    it('should open the "Add Project" modal, and add the new project to the table after successful submission', async () => {
      const initialProjects = [
        createMockProject({ id: '1', name: 'Existing Project' }),
      ];
      const newProject = createMockProject({
        id: '2',
        name: 'A Brand New Project',
      });

      // Mock the context's addProject function to simulate a successful API call
      const addProjectMock = jest.fn().mockResolvedValue(newProject);

      const projectContextValue = createMockProjectContext({
        projects: initialProjects,
        isLoading: false,
        error: null,
        addProject: addProjectMock,
      });

      const { user, rerender } = renderComponent(projectContextValue);

      // 1. Open the modal
      await user.click(screen.getByRole('button', { name: /add project/i }));
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('heading', { name: /create new project/i })
      ).toBeInTheDocument();

      // 2. Fill and submit the form
      await user.type(
        within(dialog).getByLabelText(/project name/i),
        newProject.name
      );
      await user.click(
        within(dialog).getByRole('button', { name: /create project/i })
      );

      // 3. Verify the context function was called correctly
      await waitFor(() => {
        expect(addProjectMock).toHaveBeenCalledWith({ name: newProject.name });
      });

      // 4. Simulate the context updating by re-rendering with the new data
      const updatedProjects = [...initialProjects, newProject];
      const updatedContextValue = createMockProjectContext({
        projects: updatedProjects,
        addProject: addProjectMock,
      });
      rerender(
        <MemoryRouter>
          <TestProviders
            projectValue={updatedContextValue}
            authValue={createAuthenticatedContext()}
            errorValue={createMockErrorContext()}
          >
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
            </Routes>
          </TestProviders>
        </MemoryRouter>
      );

      // 5. Verify the UI has been updated
      const table = screen.getByRole('table');
      expect(
        within(table).getByText(/a brand new project/i)
      ).toBeInTheDocument();
    });

    it('should open the "Edit Project" modal with correct data, and update the project in the table after a successful edit', async () => {
      const projectToEdit = createMockProject({
        id: '1',
        name: 'Initial Project Name',
      });
      const updatedProject = { ...projectToEdit, name: 'Updated Project Name' };

      const updateProjectMock = jest.fn().mockResolvedValue(updatedProject);
      const projectContextValue = createMockProjectContext({
        projects: [projectToEdit],
        updateProject: updateProjectMock,
      });

      const { user, rerender } = renderComponent(projectContextValue);

      // 1. Open the edit modal
      const row = screen.getByText(projectToEdit.name).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      // 2. Verify the modal is open with the correct data
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('heading', { name: /edit project/i })
      ).toBeInTheDocument();
      const nameInput = within(dialog).getByLabelText(/project name/i);
      expect(nameInput).toHaveValue(projectToEdit.name);

      // 3. Edit and submit the form
      await user.clear(nameInput);
      await user.type(nameInput, updatedProject.name);
      await user.click(
        within(dialog).getByRole('button', { name: /save changes/i })
      );

      // 4. Verify the context function was called
      await waitFor(() => {
        expect(updateProjectMock).toHaveBeenCalledWith(projectToEdit.id, {
          name: updatedProject.name,
        });
      });

      // 5. Re-render with updated data to simulate context change
      const updatedContext = createMockProjectContext({
        projects: [updatedProject],
        updateProject: updateProjectMock,
      });
      rerender(
        <MemoryRouter>
          <TestProviders projectValue={updatedContext}>
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
            </Routes>
          </TestProviders>
        </MemoryRouter>
      );

      // 6. Verify the UI has updated
      const table = screen.getByRole('table');
      expect(within(table).getByText(updatedProject.name)).toBeInTheDocument();
      expect(
        within(table).queryByText(projectToEdit.name)
      ).not.toBeInTheDocument();
    });

    it('should open a confirmation modal, and remove the project from the table when deletion is confirmed', async () => {
      const projectToDelete = createMockProject({
        id: '1',
        name: 'Project To Delete',
      });
      const deleteProjectMock = jest.fn().mockResolvedValue({});
      const projectContextValue = createMockProjectContext({
        projects: [projectToDelete],
        deleteProject: deleteProjectMock,
      });

      const { user, rerender } = renderComponent(projectContextValue);

      // 1. Open the delete confirmation modal
      const row = screen.getByText(projectToDelete.name).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      // 2. Verify the modal is open
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('heading', { name: /delete project/i })
      ).toBeInTheDocument();

      // 3. Confirm deletion
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      // 4. Verify context function was called
      await waitFor(() => {
        expect(deleteProjectMock).toHaveBeenCalledWith(projectToDelete.id);
      });

      // 5. Re-render with updated data to simulate context change
      const updatedContext = createMockProjectContext({
        projects: [],
        deleteProject: deleteProjectMock,
      });
      rerender(
        <MemoryRouter>
          <TestProviders projectValue={updatedContext}>
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
            </Routes>
          </TestProviders>
        </MemoryRouter>
      );

      // 6. Verify the project is removed from the UI
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
      const {
        getAllProjects,
        deleteProjectAPI,
      } = require('@/services/projectApiService');
      /** @type {jest.Mock} */ (getAllProjects).mockResolvedValue([
        projectToDelete,
      ]);
      /** @type {jest.Mock} */ (deleteProjectAPI).mockRejectedValue(error);
      const showErrorToastMock = jest.fn();
      const errorContextValue = createMockErrorContext({
        showErrorToast: showErrorToastMock,
      });
      const authContextValue = createAuthenticatedContext();
      const user = userEvent.setup();
      render(
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
      );
      const row = await screen.findByText(projectToDelete.name).then(el =>
        el.closest('tr')
      );
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));
      await waitFor(() => {
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to delete project.',
          })
        );
      });
      expect(screen.getByText(projectToDelete.name)).toBeInTheDocument();
    });
  });
  describe('Story 4: Navigating to a Project', () => {
    it('should render a link for each project that navigates to the correct project tasks page', async () => {
      const project = createMockProject({
        id: 'proj-1',
        name: 'My Test Project',
      });
      const projectContextValue = createMockProjectContext({
        projects: [project],
      });

      const { user } = renderComponent(projectContextValue);

      const projectLink = screen.getByRole('link', {
        name: /my test project/i,
      });
      expect(projectLink).toHaveAttribute('href', '/projects/proj-1');

      // Click the link to navigate
      await user.click(projectLink);

      // Verify that the app has navigated to the mock tasks page,
      // which silences the router warning and confirms navigation occurred.
      expect(
        screen.getByText(/mock project tasks page/i)
      ).toBeInTheDocument();
    });
  });

  describe('Story 5: Accessibility', () => {
    it('should have no accessibility violations on initial render or when modals are open', async () => {
      const projects = [createMockProject({ id: '1', name: 'Accessible Project' })];
      const projectContextValue = createMockProjectContext({
        projects,
      });

      const { container, user } = renderComponent(projectContextValue);

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
