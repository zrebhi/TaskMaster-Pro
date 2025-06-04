import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DashboardPage from '../../../pages/DashboardPage';
import {
  renderWithMinimalProviders,
  createMockProject,
  createMockTask,
  setupTest,
  waitForElementToBeRemoved,
} from '../../helpers/test-utils';
import {
  createMockProjectContext,
  createMockTaskContext,
  createProjectContextWithProjects,
  createLoadingProjectContext,
  createErrorProjectContext,
  createTaskContextWithTasks,
  createLoadingTaskContext,
  createErrorTaskContext,
  TestProviders,
} from '../../helpers/mock-providers';

// Mock child components to focus on DashboardPage logic
jest.mock('../../../components/Projects/AddProjectForm', () => {
  return function MockAddProjectForm() {
    return <div data-testid="add-project-form">Add Project Form</div>;
  };
});

jest.mock('../../../components/Projects/ProjectList', () => {
  return function MockProjectList({
    projects,
    onSelectProject,
    activeProjectId,
    onEditProject,
    onDeleteProject,
  }) {
    return (
      <div data-testid="project-list">
        {projects.map((project) => (
          <div key={project.id} data-testid={`project-${project.id}`}>
            <span>{project.name}</span>
            <button onClick={() => onSelectProject(project.id)}>Select</button>
            <button onClick={() => onEditProject(project)}>Edit</button>
            <button onClick={() => onDeleteProject(project.id, project.name)}>
              Delete
            </button>
            {activeProjectId === project.id && (
              <span data-testid="active-indicator">Active</span>
            )}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/Projects/EditProjectModal', () => {
  return function MockEditProjectModal({ project, isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="edit-project-modal">
        <span>Edit Project: {project?.name}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('../../../components/Projects/DeleteProjectModal', () => {
  return function MockDeleteProjectModal({
    isOpen,
    onClose,
    onConfirm,
    message,
    isLoading,
  }) {
    return isOpen ? (
      <div data-testid="delete-project-modal">
        <span>{message}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Deleting...' : 'Confirm'}
        </button>
      </div>
    ) : null;
  };
});

jest.mock('../../../components/Tasks/TaskList', () => {
  return function MockTaskList({ tasks }) {
    return (
      <div data-testid="task-list">
        {tasks.map((task) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.title}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/Tasks/AddTaskForm', () => {
  return function MockAddTaskForm({ projectId }) {
    return <div data-testid="add-task-form">Add Task Form for {projectId}</div>;
  };
});

describe('DashboardPage Unit Tests', () => {
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  const renderDashboardPage = (projectValue = {}, taskValue = {}) => {
    const defaultProjectValue = createMockProjectContext();
    const defaultTaskValue = createMockTaskContext();

    return renderWithMinimalProviders(
      <TestProviders
        projectValue={{ ...defaultProjectValue, ...projectValue }}
        taskValue={{ ...defaultTaskValue, ...taskValue }}
      >
        <DashboardPage />
      </TestProviders>
    );
  };

  // Helper to create single project scenario (used 3+ times)
  const createSingleProjectScenario = (projectOverrides = {}) => {
    const project = createMockProject({
      id: 'proj1',
      name: 'Project 1',
      ...projectOverrides,
    });
    return {
      project,
      projects: [project],
      projectContext: createProjectContextWithProjects([project]),
    };
  };

  // Helper for modal interactions (used 3+ times)
  const openModalAndVerify = async (
    buttonText,
    modalTestId,
    expectedContent
  ) => {
    const button = screen.getByText(buttonText);
    await user.click(button);

    const modal = screen.getByTestId(modalTestId);
    expect(modal).toBeInTheDocument();
    if (expectedContent) {
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
    }
    return modal;
  };

  const closeModalAndVerify = async (closeButtonText, modalTestId) => {
    const closeButton = screen.getByText(closeButtonText);
    await user.click(closeButton);

    await waitForElementToBeRemoved(() => screen.queryByTestId(modalTestId));
  };

  describe('Initial Rendering', () => {
    test('renders main layout structure', () => {
      renderDashboardPage();

      expect(
        screen.getByRole('heading', { level: 2, name: /^projects$/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId('add-project-form')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: /your projects/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select a project to view its tasks/i)
      ).toBeInTheDocument();
    });

    test('calls fetchProjects on mount', () => {
      const mockFetchProjects = jest.fn();
      renderDashboardPage({ fetchProjects: mockFetchProjects });

      expect(mockFetchProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe('Project Loading States', () => {
    test('displays loading message when projects are loading', () => {
      renderDashboardPage(createLoadingProjectContext());

      expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
      expect(screen.queryByTestId('project-list')).not.toBeInTheDocument();
    });

    test('displays error message when project loading fails', () => {
      const errorMessage = 'Failed to load projects';
      renderDashboardPage(createErrorProjectContext(errorMessage));

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByTestId('project-list')).not.toBeInTheDocument();
    });

    test('displays project list when projects load successfully', () => {
      const projects = [
        createMockProject({ id: 'proj1', name: 'Project 1' }),
        createMockProject({ id: 'proj2', name: 'Project 2' }),
      ];
      renderDashboardPage(createProjectContextWithProjects(projects));

      expect(screen.getByTestId('project-list')).toBeInTheDocument();
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
      expect(
        screen.queryByText(/loading projects.../i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Project Selection', () => {
    test('calls fetchTasks when project is selected and displays task section', async () => {
      const mockFetchTasks = jest.fn();
      const { projectContext } = createSingleProjectScenario();

      renderDashboardPage(projectContext, { fetchTasks: mockFetchTasks });

      const selectButton = screen.getByText('Select');
      await user.click(selectButton);

      expect(mockFetchTasks).toHaveBeenCalledWith('proj1');
      expect(screen.getByText(/tasks for: project 1/i)).toBeInTheDocument();
      expect(screen.getByTestId('add-task-form')).toBeInTheDocument();
    });

    test('calls clearTasks when no project is selected', () => {
      const mockClearTasks = jest.fn();

      renderDashboardPage({}, { clearTasks: mockClearTasks });

      expect(mockClearTasks).toHaveBeenCalled();
    });
  });

  describe('Modal Management', () => {
    test('opens and closes edit modal', async () => {
      const { projectContext } = createSingleProjectScenario();
      renderDashboardPage(projectContext);

      await openModalAndVerify(
        'Edit',
        'edit-project-modal',
        'Edit Project: Project 1'
      );
      await closeModalAndVerify('Close', 'edit-project-modal');

      // Explicit assertion for lint
      expect(
        screen.queryByTestId('edit-project-modal')
      ).not.toBeInTheDocument();
    });

    test('opens and closes delete modal', async () => {
      const { projectContext } = createSingleProjectScenario();
      renderDashboardPage(projectContext);

      await openModalAndVerify(
        'Delete',
        'delete-project-modal',
        /are you sure you want to delete the project "project 1"/i
      );
      await closeModalAndVerify('Cancel', 'delete-project-modal');

      // Explicit assertion for lint
      expect(
        screen.queryByTestId('delete-project-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('Delete Project Functionality', () => {
    test('calls deleteProject when confirm button is clicked', async () => {
      const mockDeleteProject = jest.fn().mockResolvedValue();
      const { projectContext } = createSingleProjectScenario();

      renderDashboardPage({
        ...projectContext,
        deleteProject: mockDeleteProject,
      });

      await openModalAndVerify('Delete', 'delete-project-modal');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockDeleteProject).toHaveBeenCalledWith('proj1');
    });

    test('clears activeProjectId when deleting active project', async () => {
      const mockDeleteProject = jest.fn().mockResolvedValue();
      const mockFetchTasks = jest.fn();
      const { projectContext } = createSingleProjectScenario();

      renderDashboardPage(
        { ...projectContext, deleteProject: mockDeleteProject },
        { fetchTasks: mockFetchTasks }
      );

      // First select the project
      const selectButton = screen.getByText('Select');
      await user.click(selectButton);
      expect(screen.getByText(/tasks for: project 1/i)).toBeInTheDocument();

      // Then delete it
      await openModalAndVerify('Delete', 'delete-project-modal');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteProject).toHaveBeenCalledWith('proj1');
      });

      expect(
        screen.getByText(/select a project to view its tasks/i)
      ).toBeInTheDocument();
    });

    test('handles delete error gracefully', async () => {
      const { consoleSpy } = setupTest();
      const mockDeleteProject = jest
        .fn()
        .mockRejectedValue(new Error('Delete failed'));
      const { projectContext } = createSingleProjectScenario();

      renderDashboardPage({
        ...projectContext,
        deleteProject: mockDeleteProject,
      });

      await openModalAndVerify('Delete', 'delete-project-modal');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteProject).toHaveBeenCalledWith('proj1');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Delete project error:',
        expect.any(Error)
      );

      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-project-modal')
      );

      consoleSpy.mockRestore();
    });

    test('shows loading state during delete operation', async () => {
      let resolveDelete;
      const mockDeleteProject = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          })
      );
      const { projectContext } = createSingleProjectScenario();

      renderDashboardPage({
        ...projectContext,
        deleteProject: mockDeleteProject,
      });

      await openModalAndVerify('Delete', 'delete-project-modal');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      // Should show loading state
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByText('Deleting...')).toBeDisabled();

      // Resolve the delete operation
      resolveDelete();

      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('delete-project-modal')
      );
    });
  });

  describe('Task Display States', () => {
    const selectProjectAndVerifyTaskState = async (
      taskContext,
      expectedContent
    ) => {
      const { projectContext } = createSingleProjectScenario();
      renderDashboardPage(projectContext, taskContext);

      const selectButton = screen.getByText('Select');
      await user.click(selectButton);

      if (typeof expectedContent === 'string') {
        expect(
          screen.getByText(new RegExp(expectedContent, 'i'))
        ).toBeInTheDocument();
      } else {
        expectedContent();
      }
    };

    test('displays task loading state', async () => {
      await selectProjectAndVerifyTaskState(
        createLoadingTaskContext(),
        'loading tasks...'
      );

      // Explicit assertion for lint
      expect(screen.getByText(/loading tasks.../i)).toBeInTheDocument();
    });

    test('displays task error state', async () => {
      await selectProjectAndVerifyTaskState(
        createErrorTaskContext('Failed to load tasks'),
        'Failed to load tasks'
      );

      // Explicit assertion for lint
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });

    test('displays tasks when loaded', async () => {
      const tasks = [
        createMockTask({ id: 'task1', title: 'Task 1', projectId: 'proj1' }),
        createMockTask({ id: 'task2', title: 'Task 2', projectId: 'proj1' }),
      ];

      await selectProjectAndVerifyTaskState(
        createTaskContextWithTasks(tasks, {
          currentProjectIdForTasks: 'proj1',
        }),
        () => {
          expect(screen.getByTestId('task-list')).toBeInTheDocument();
          expect(screen.getByText('Task 1')).toBeInTheDocument();
          expect(screen.getByText('Task 2')).toBeInTheDocument();
        }
      );
    });

    test('displays no tasks message when project has no tasks', async () => {
      await selectProjectAndVerifyTaskState(
        createTaskContextWithTasks([], { currentProjectIdForTasks: 'proj1' }),
        'no tasks in this project yet'
      );

      // Explicit assertion for lint
      expect(
        screen.getByText(/no tasks in this project yet/i)
      ).toBeInTheDocument();
    });
  });
});
