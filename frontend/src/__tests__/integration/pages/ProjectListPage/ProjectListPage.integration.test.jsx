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

import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect';

import {
  createMockProject,
  waitForElementToBeRemoved,
} from '@/__tests__/helpers/test-utils';
import { renderProjectListPage } from './ProjectListPage.TestSetup';
import { setupPageTests } from '@/__tests__/helpers/integration-test-utils';
import {
  createMockErrorContext,
} from '@/__tests__/helpers/mock-providers';

// Mock the underlying API service to isolate the frontend.
jest.mock('@/services/projectApiService');
// Import the mocked service functions to control them in tests
const {
  getAllProjects,
  createProjectAPI,
  updateProjectAPI,
  deleteProjectAPI,
} = require('@/services/projectApiService');

describe('Integration Test: ProjectListPage', () => {
  let user;
  let queryClient;

  // Use the standard setup to manage user events and the query client
  const testState = setupPageTests();

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
  });

  describe('Story 1: Viewing Projects', () => {
    it('should display a loading indicator while projects are being fetched', () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockReturnValue(new Promise(() => {})); // Pending promise
      renderProjectListPage(queryClient);

      expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
    });

    it('should display an error message if the projects fail to load', async () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockRejectedValue(
        new Error('Failed to fetch projects.')
      );
      renderProjectListPage(queryClient);

      // The component displays its own error message now.
      expect(
        await screen.findByText(/could not load projects/i)
      ).toBeInTheDocument();
    });

    it('should display an empty state if I have no projects', async () => {
      /** @type {jest.Mock} */
      (getAllProjects).mockResolvedValue([]); // Mock API returns empty array
      renderProjectListPage(queryClient);

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
      getAllProjects.mockResolvedValue(projects);

      renderProjectListPage(queryClient);

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
      /** @type {jest.Mock} */
      (createProjectAPI).mockResolvedValue(newProject);
      renderProjectListPage(queryClient);

      // Wait for initial projects to load before interacting.
      await screen.findByText('Existing Project');

      // The navigation on success is handled inside AddProjectModal, which this test triggers.
      // We assume AddProjectModal is configured to navigate on success.
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
        expect(createProjectAPI).toHaveBeenCalledWith({
          name: newProject.name,
        });
      });

      // The test assumes the AddProjectModal hook's success callback navigates.
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
      /** @type {jest.Mock} */
      (updateProjectAPI).mockResolvedValue(updatedProject);
      renderProjectListPage(queryClient);

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
        expect(updateProjectAPI).toHaveBeenCalledWith(projectToEdit.id, {
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
      /** @type {jest.Mock} */
      (deleteProjectAPI).mockResolvedValue({});
      renderProjectListPage(queryClient);

      const row = await screen.findByText(projectToDelete.name);
      await user.click(
        within(row.closest('tr')).getByRole('button', { name: /open menu/i })
      );
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(deleteProjectAPI).toHaveBeenCalledWith(projectToDelete.id);
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
      getAllProjects.mockResolvedValue([projectToDelete]);
      deleteProjectAPI.mockRejectedValue(error);

      // FIX: The component must be rendered inside THIS test with the correct context.
      const showErrorToastMock = jest.fn();
      const errorContextValue = createMockErrorContext({
        showErrorToast: showErrorToastMock,
      });

      renderProjectListPage(queryClient, { errorContext: errorContextValue });

      // Now this findByText will succeed because the component has been rendered.
      const row = await screen.findByText(projectToDelete.name);
      await user.click(
        within(row.closest('tr')).getByRole('button', { name: /open menu/i })
      );
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const expectedMessage =
          'An unexpected error occurred while deleting the project. Please try again.';
        expect(showErrorToastMock).toHaveBeenCalledWith(
          expect.objectContaining({ message: expectedMessage })
        );
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
      renderProjectListPage(queryClient);

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
      getAllProjects.mockResolvedValue(projects);
      // FIX: Do not destructure `user` from the render result. It's already in scope.
      const { container } = renderProjectListPage(queryClient);

      await screen.findByRole('table');

      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // The `user` variable from `beforeEach` is correctly used here.
      await user.click(screen.getByRole('button', { name: /add project/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
      await user.click(screen.getByRole('button', { name: /close/i }));

      const row = screen.getByText(/accessible project/i).closest('tr');
      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await user.click(within(row).getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      await screen.findByRole('dialog');
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});