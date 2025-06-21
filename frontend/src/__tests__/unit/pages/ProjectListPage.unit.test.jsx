import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  setupTest,
  renderWithMinimalProviders,
  createMockProject,
} from '../../helpers/test-utils';
import {
  createLoadingProjectContext,
  createErrorProjectContext,
  createProjectContextWithProjects,
  TestProviders,
} from '../../helpers/mock-providers';
import ProjectListPage from '../../../pages/ProjectListPage';
import { resetApiMocks } from '../../helpers/api-mocks';
import { MemoryRouter } from 'react-router-dom';

// Mock child components
jest.mock('../../../components/Projects/AddProjectForm', () => {
  return function MockAddProjectForm() {
    return <div data-testid="add-project-form">Add Project Form</div>;
  };
});

jest.mock('../../../components/Projects/AddProjectModal', () => {
  return function MockAddProjectModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="add-project-modal">
        <button onClick={onClose} data-testid="close-add-modal">
          Close Modal
        </button>
      </div>
    ) : null;
  };
});

// Mock the useNavigate hook from react-router-dom
const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

describe('ProjectListPage', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    resetApiMocks();
  });

  it('renders the loading state initially', async () => {
    const projectContextValue = createLoadingProjectContext();
    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    // Resolve the pending promise to clean up after the test
    if (projectContextValue._resolveFetchProjects) {
      projectContextValue._resolveFetchProjects();
    }
  });

  it('renders the error state', () => {
    const errorMessage = 'Could not fetch projects';
    const projectContextValue = createErrorProjectContext(errorMessage);
    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders a list of projects and navigates on click', async () => {
    const projects = [
      createMockProject({ id: '1', name: 'Project One' }),
      createMockProject({ id: '2', name: 'Project Two' }),
    ];
    const projectContextValue = createProjectContextWithProjects(projects);
    const user = userEvent.setup();

    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Project Two')).toBeInTheDocument();

    // Check for "View Tasks" buttons and simulate click
    const viewTasksButtons = screen.getAllByTitle(/view tasks for/i);
    expect(viewTasksButtons).toHaveLength(2);

    // Simulate click on the first project's "View Tasks" button
    await user.click(viewTasksButtons[0]);
    expect(mockUseNavigate).toHaveBeenCalledWith('/projects/1');

    // Simulate click on the second project's "View Tasks" button
    await user.click(viewTasksButtons[1]);
    expect(mockUseNavigate).toHaveBeenCalledWith('/projects/2');
  });

  it('handles edit project functionality', async () => {
    const projects = [
      createMockProject({ id: '1', name: 'Project One' }),
      createMockProject({ id: '2', name: 'Project Two' }),
    ];
    const projectContextValue = createProjectContextWithProjects(projects);
    const user = userEvent.setup();

    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    // Test edit functionality - click on dropdown menu trigger for first project
    const dropdownTriggers = screen.getAllByRole('button', {
      name: /open menu/i,
    });
    expect(dropdownTriggers).toHaveLength(2);

    await user.click(dropdownTriggers[0]);

    // Click on Edit option in dropdown
    const editButton = screen.getByRole('menuitem', { name: /edit/i });
    await user.click(editButton);

    // Verify edit modal is shown with correct project name
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Project One')).toBeInTheDocument();

    // Test closing the edit modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify modal is closed
    expect(screen.queryByText('Edit Project')).not.toBeInTheDocument();
  });

  it('handles delete project functionality', async () => {
    const projects = [
      createMockProject({ id: '1', name: 'Project One' }),
      createMockProject({ id: '2', name: 'Project Two' }),
    ];
    const projectContextValue = createProjectContextWithProjects(projects);
    const user = userEvent.setup();

    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    // Test delete functionality - click on dropdown menu trigger for first project
    const dropdownTriggers = screen.getAllByRole('button', {
      name: /open menu/i,
    });
    expect(dropdownTriggers).toHaveLength(2);

    await user.click(dropdownTriggers[0]);

    // Click on Delete option in dropdown
    const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
    await user.click(deleteButton);

    // Verify delete confirmation modal is shown with correct project name
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(
      screen.getByText(
        /are you sure you want to delete the project "Project One"/i
      )
    ).toBeInTheDocument();

    // Test closing the delete modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify modal is closed
    expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
  });

  it('handles confirming project deletion', async () => {
    const projects = [
      createMockProject({ id: '1', name: 'Project One' }),
      createMockProject({ id: '2', name: 'Project Two' }),
    ];
    const mockDeleteProject = jest.fn().mockResolvedValue();
    const projectContextValue = createProjectContextWithProjects(projects);
    projectContextValue.deleteProject = mockDeleteProject;
    const user = userEvent.setup();

    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    // Open delete modal
    const dropdownTriggers = screen.getAllByRole('button', {
      name: /open menu/i,
    });
    await user.click(dropdownTriggers[0]);

    const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    // Verify deleteProject was called with correct ID
    expect(mockDeleteProject).toHaveBeenCalledWith('1');
  });

  it('handles delete project error', async () => {
    const projects = [createMockProject({ id: '1', name: 'Project One' })];
    const mockDeleteProject = jest
      .fn()
      .mockRejectedValue(new Error('Delete failed'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const projectContextValue = createProjectContextWithProjects(projects);
    projectContextValue.deleteProject = mockDeleteProject;
    const user = userEvent.setup();

    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );

    // Open delete modal
    const dropdownTriggers = screen.getAllByRole('button', {
      name: /open menu/i,
    });
    await user.click(dropdownTriggers[0]);

    const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    // Wait for error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Delete project error:',
        expect.any(Error)
      );
    });

    // Modal should still close even on error
    expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders empty state and allows opening the add modal', async () => {
    const projectContextValue = createProjectContextWithProjects([]);
    const user = userEvent.setup();
 
     renderWithMinimalProviders(
       <MemoryRouter>
         <TestProviders projectValue={projectContextValue}>
           <ProjectListPage />
         </TestProviders>
       </MemoryRouter>
     );
 
    // Find and click the "Add Project" button within the empty state
    const addProjectButton = screen.getByRole('button', {
      name: /add project/i,
    });
    await user.click(addProjectButton);
 
    // Assert that clicking the button opens the modal
    expect(screen.getByTestId('add-project-modal')).toBeInTheDocument();
  });
 
  it('handles opening and closing the add project modal via the toolbar', async () => {
    const projects = [createMockProject({ id: '1', name: 'Project One' })];
    const projectContextValue = createProjectContextWithProjects(projects);
    const user = userEvent.setup();
 
    renderWithMinimalProviders(
      <MemoryRouter>
        <TestProviders projectValue={projectContextValue}>
          <ProjectListPage />
        </TestProviders>
      </MemoryRouter>
    );
 
    // Initially modal should not be visible
    expect(screen.queryByTestId('add-project-modal')).not.toBeInTheDocument();
 
    // Wait for the toolbar to appear, then find and click the "Add Project" button within it.
    // We find all buttons with this name and click the one that appears alongside the table.
    const addProjectButtons = await screen.findAllByRole('button', {
      name: /add project/i,
    });
    // The button in the toolbar will be present since we have projects.
    const toolbarAddButton = addProjectButtons[0];
    await user.click(toolbarAddButton);
 
    // Verify modal is now open
    expect(screen.getByTestId('add-project-modal')).toBeInTheDocument();
 
    // Find the close button inside the modal and click it
    const closeButton = screen.getByTestId('close-add-modal');
    await user.click(closeButton);
 
    // Verify modal is closed
    expect(screen.queryByTestId('add-project-modal')).not.toBeInTheDocument();
  });
});
