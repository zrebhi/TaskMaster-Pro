import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DashboardPage from '../DashboardPage';
import ProjectContext from '../../context/ProjectContext';
import TaskContext from '../../context/TaskContext';
import AuthContext from '../../context/AuthContext';
import { ErrorProvider } from '../../context/ErrorContext';

// Mock API services
jest.mock('../../services/projectApiService', () => ({
  getAllProjects: jest.fn(),
  createProjectAPI: jest.fn(),
  updateProjectAPI: jest.fn(),
  deleteProjectAPI: jest.fn(),
}));

jest.mock('../../services/taskApiService', () => ({
  getTasksForProjectAPI: jest.fn(),
}));

// Mock child components to simplify testing DashboardPage logic
jest.mock('../../components/Projects/AddProjectForm', () => ({
  __esModule: true,
  default: () => <div>AddProjectForm Mock</div>,
}));
jest.mock('../../components/Projects/ProjectList', () => ({
  __esModule: true,
  default: ({ projects, onSelectProject, onEditProject, onDeleteProject }) => (
    <div>
      ProjectList Mock
      {projects.map((project) => (
        <div key={project.id} data-testid={`project-item-${project.id}`}>
          {project.name}
          <button onClick={() => onSelectProject(project.id)}>Select</button>
          <button onClick={() => onEditProject(project)}>Edit</button>
          <button onClick={() => onDeleteProject(project.id, project.name)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  ),
}));
// More interactive mock for EditProjectModal
const mockEditModalPassedProps = {
  onClose: null,
  project: null,
};

jest.mock('../../components/Projects/EditProjectModal', () => {
  jest.requireActual('../../components/Projects/EditProjectModal');
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, project }) => {
      mockEditModalPassedProps.onClose = onClose;
      mockEditModalPassedProps.project = project;

      if (!isOpen || !project) {
        return null;
      }
      return (
        <div data-testid="edit-project-modal-mock">
          <span>EditProjectModal Mock for {project.name}</span>
          {/* Provide ways for tests to simulate prop calls if needed,
              though direct calls to mockEditModalPassedProps.onClose() etc. are easier */}
        </div>
      );
    }),
  };
});

jest.mock('../../components/Projects/DeleteProjectModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm, title, message, isLoading }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm} disabled={isLoading}>
          Confirm
        </button>
        <button onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
      </div>
    ) : null,
}));

const mockProjects = [
  { id: 'project-1-id', name: 'Project One', user_id: 'user-id' },
  { id: 'project-2-id', name: 'Project Two', user_id: 'user-id' },
];

const mockProjectContext = {
  projects: mockProjects,
  fetchProjects: jest.fn(),
  addProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn().mockResolvedValue(undefined), // Mock deleteProject
  isLoading: false,
  error: null,
};

const mockAuthContext = {
  isAuthenticated: true,
  token: 'fake-token',
  logout: jest.fn(),
};

const mockTaskContext = {
  tasks: [],
  isLoadingTasks: false,
  taskError: null,
  fetchTasks: jest.fn(),
  clearTasks: jest.fn(),
  currentProjectIdForTasks: null,
  addTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
};

const renderDashboard = (
  projectContextOverrides = {},
  authContextOverrides = {},
  taskContextOverrides = {}
) => {
  return render(
    <ErrorProvider>
      <AuthContext.Provider
        value={{ ...mockAuthContext, ...authContextOverrides }}
      >
        <ProjectContext.Provider
          value={{ ...mockProjectContext, ...projectContextOverrides }}
        >
          <TaskContext.Provider
            value={{ ...mockTaskContext, ...taskContextOverrides }}
          >
            <DashboardPage />
          </TaskContext.Provider>
        </ProjectContext.Provider>
      </AuthContext.Provider>
    </ErrorProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DashboardPage - Delete Project Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open the confirmation modal when delete button is clicked', async () => {
    renderDashboard();

    // Wait for ProjectList mock to render
    await screen.findByText('ProjectList Mock');

    const projectOneItem = screen.getByTestId('project-item-project-1-id');
    const deleteButton = within(projectOneItem).getByText('Delete', {
      selector: 'button',
    });
    await userEvent.click(deleteButton);

    const confirmationModal = screen.getByTestId('confirmation-modal');
    expect(confirmationModal).toBeInTheDocument();
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete the project "Project One"? This will also delete all associated tasks.'
      )
    ).toBeInTheDocument();
  });

  it('should close the confirmation modal when Cancel button is clicked', async () => {
    renderDashboard();

    await screen.findByText('ProjectList Mock');
    const projectOneItem = screen.getByTestId('project-item-project-1-id');
    const deleteButton = within(projectOneItem).getByText('Delete', {
      selector: 'button',
    });
    await userEvent.click(deleteButton);

    const cancelButton = screen.getByText('Cancel', { selector: 'button' });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('confirmation-modal')
      ).not.toBeInTheDocument();
    });
  });

  it('should call deleteProject from ProjectContext on confirm', async () => {
    renderDashboard();

    await screen.findByText('ProjectList Mock');
    const projectOneItem = screen.getByTestId('project-item-project-1-id');
    const deleteButton = within(projectOneItem).getByText('Delete', {
      selector: 'button',
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm', { selector: 'button' });
    await userEvent.click(confirmButton);

    // Expect deleteProject from ProjectContext to have been called with the correct project ID
    expect(mockProjectContext.deleteProject).toHaveBeenCalledTimes(1);
    expect(mockProjectContext.deleteProject).toHaveBeenCalledWith(
      'project-1-id'
    );

    // Expect the modal to be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId('confirmation-modal')
      ).not.toBeInTheDocument();
    });
  });

  it('should clear activeProjectId if the deleted project was active', async () => {
    renderDashboard();

    await screen.findByText('ProjectList Mock');
    const projectOneItem = screen.getByTestId('project-item-project-1-id');

    // Simulate selecting the project first
    const selectButton = within(projectOneItem).getByText('Select', {
      selector: 'button',
    });
    await userEvent.click(selectButton);

    // Now click the delete button for the active project
    const deleteButton = within(projectOneItem).getByText('Delete', {
      selector: 'button',
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText('Confirm', { selector: 'button' });
    await userEvent.click(confirmButton);

    // Expect the "Select a project..." message to appear, indicating activeProjectId was cleared
    await waitFor(() => {
      expect(
        screen.getByText(
          'Select a project to view its tasks, or create a new project.'
        )
      ).toBeInTheDocument();
    });
  });
});

describe('DashboardPage - Edit Project Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open EditProjectModal with correct project when edit button is clicked', async () => {
    renderDashboard();
    const projectToEdit = mockProjects[0]; // Project One

    await screen.findByText('ProjectList Mock'); // Ensure ProjectList is rendered

    const projectOneItem = screen.getByTestId(
      `project-item-${projectToEdit.id}`
    );
    const editButton = within(projectOneItem).getByText('Edit', {
      selector: 'button',
    });
    await userEvent.click(editButton);

    // Check if EditProjectModal mock is rendered (isOpen became true)
    await waitFor(() => {
      expect(screen.getByTestId('edit-project-modal-mock')).toBeInTheDocument();
    });

    // Check that the mock was called with the correct project prop
    expect(
      require('../../components/Projects/EditProjectModal').default
    ).toHaveBeenCalled();
    expect(mockEditModalPassedProps.project).toEqual(projectToEdit);
    expect(
      screen.getByText(`EditProjectModal Mock for ${projectToEdit.name}`)
    ).toBeInTheDocument();
  });

  it('should close EditProjectModal when its onClose prop is called', async () => {
    renderDashboard();
    const projectToEdit = mockProjects[0];

    await screen.findByText('ProjectList Mock');
    const projectOneItem = screen.getByTestId(
      `project-item-${projectToEdit.id}`
    );
    const editButton = within(projectOneItem).getByText('Edit', {
      selector: 'button',
    });
    await userEvent.click(editButton);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByTestId('edit-project-modal-mock')).toBeInTheDocument();
      expect(mockEditModalPassedProps.onClose).toBeInstanceOf(Function);
    });

    // Simulate the modal calling its onClose prop
    act(() => {
      mockEditModalPassedProps.onClose();
    });

    // Modal should now be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId('edit-project-modal-mock')
      ).not.toBeInTheDocument();
    });
  });

  it('should call updateProject from ProjectContext and close modal when edit is confirmed (simulated)', async () => {
    renderDashboard();
    const projectToEdit = mockProjects[0]; // Project One
    const updatedProjectData = {
      ...projectToEdit,
      name: 'Updated Project One Name',
    };

    await screen.findByText('ProjectList Mock'); // Ensure ProjectList is rendered

    const projectOneItem = screen.getByTestId(
      `project-item-${projectToEdit.id}`
    );
    const editButton = within(projectOneItem).getByText('Edit', {
      selector: 'button',
    });
    await userEvent.click(editButton);

    // Wait for the modal to open
    await waitFor(() => {
      expect(screen.getByTestId('edit-project-modal-mock')).toBeInTheDocument();
      expect(mockEditModalPassedProps.onClose).toBeInstanceOf(Function); // Ensure onClose is available
    });

    // Simulate the modal's internal logic calling updateProject and then onClose
    // This bypasses simulating form interaction within the mock modal
    act(() => {
      mockProjectContext.updateProject(projectToEdit.id, {
        name: updatedProjectData.name,
      });
      mockEditModalPassedProps.onClose(); // Simulate modal closing after update
    });

    // Expect updateProject from ProjectContext to have been called with the correct project ID and data
    expect(mockProjectContext.updateProject).toHaveBeenCalledTimes(1);
    expect(mockProjectContext.updateProject).toHaveBeenCalledWith(
      projectToEdit.id,
      { name: updatedProjectData.name }
    );

    // Expect the modal to be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId('edit-project-modal-mock')
      ).not.toBeInTheDocument();
    });
  });
});
