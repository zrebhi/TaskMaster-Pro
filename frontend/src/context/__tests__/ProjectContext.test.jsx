import { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProjectContext, { ProjectProvider } from '../ProjectContext';
import AuthContext from '../AuthContext';
import { ErrorProvider } from '../ErrorContext';
import * as projectApiService from '../../services/projectApiService';

jest.mock('../../services/projectApiService');

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockShowErrorToast = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowInfo = jest.fn();

jest.mock('../ErrorContext', () => ({
  ...jest.requireActual('../ErrorContext'),
  useError: () => ({
    showErrorToast: mockShowErrorToast,
    showSuccess: mockShowSuccess,
    showInfo: mockShowInfo,
    globalErrors: [],
    isOnline: true,
    addError: jest.fn(),
    removeError: jest.fn(),
    clearAllErrors: jest.fn(),
  }),
  ErrorProvider: ({ children }) => children,
}));

// Helper component to consume ProjectContext for testing
const TestProjectConsumer = () => {
  const context = useContext(ProjectContext);

  if (!context) {
    return (
      <div data-testid="project-context-consumer">Context not available</div>
    );
  }

  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
  } = context;

  return (
    <div data-testid="project-context-consumer">
      <span data-testid="projects">{JSON.stringify(projects)}</span>
      <span data-testid="isLoading">{isLoading.toString()}</span>
      <span data-testid="error">{error ? String(error) : 'null'}</span>
      <button data-testid="fetch-projects-button" onClick={fetchProjects}>
        Fetch Projects
      </button>
      <button
        data-testid="add-project-button"
        onClick={async () => {
          try {
            await addProject({ name: 'New Project Alpha' });
          } catch {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Add Project Alpha
      </button>
      <button
        data-testid="update-project-button"
        onClick={async () => {
          try {
            await updateProject('p1', { name: 'Updated Project P1' });
          } catch {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Update Project P1
      </button>
      <button
        data-testid="delete-project-button"
        onClick={async () => {
          try {
            await deleteProject('p1');
          } catch {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Delete Project P1
      </button>
    </div>
  );
};

const mockAuthLogout = jest.fn();

describe('ProjectContext', () => {
  let user;

  const initialProjects = [];

  const renderTestComponent = (authContextValue) => {
    return render(
      <ErrorProvider>
        <AuthContext.Provider value={authContextValue}>
          <ProjectProvider>
            <TestProjectConsumer />
          </ProjectProvider>
        </AuthContext.Provider>
      </ErrorProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowErrorToast.mockClear();
    mockShowSuccess.mockClear();
    mockShowInfo.mockClear();
    user = userEvent.setup();
  });

  test('initial state is correct', () => {
    const authValue = {
      isAuthenticated: false,
      token: null,
      logout: mockAuthLogout,
    };
    renderTestComponent(authValue);

    expect(screen.getByTestId('projects')).toHaveTextContent(
      JSON.stringify(initialProjects)
    );
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  describe('fetchProjects', () => {
    test('clears projects and does not call API if not authenticated', async () => {
      const authValue = {
        isAuthenticated: false,
        token: null,
        logout: mockAuthLogout,
      };
      renderTestComponent(authValue);
      await user.click(screen.getByTestId('fetch-projects-button'));

      expect(projectApiService.getAllProjects).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([])
        );
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
    });

    test('fetches projects successfully when authenticated', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      const mockProjects = [{ id: 'p1', name: 'Project One' }];
      projectApiService.getAllProjects.mockResolvedValue(mockProjects);

      renderTestComponent(authValue);
      await user.click(screen.getByTestId('fetch-projects-button'));

      expect(projectApiService.getAllProjects).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify(mockProjects)
        );
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });

    test('sets error on generic fetch failure', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      const fallbackMessage = 'Failed to fetch projects.';
      projectApiService.getAllProjects.mockRejectedValue(
        new Error('Network Error')
      );

      renderTestComponent(authValue);
      await user.click(screen.getByTestId('fetch-projects-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify(initialProjects)
        );
        expect(screen.getByTestId('error')).toHaveTextContent(fallbackMessage);
        expect(mockShowErrorToast).toHaveBeenCalledWith({
          message: fallbackMessage,
          severity: 'medium',
        });
      });
    });

    test('sets error from err.processedError on API error', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      const processedErrorMessage = 'API specific error';
      const mockError = {
        processedError: {
          message: processedErrorMessage,
          severity: 'medium',
        },
      };
      projectApiService.getAllProjects.mockRejectedValue(mockError);

      renderTestComponent(authValue);
      await user.click(screen.getByTestId('fetch-projects-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          processedErrorMessage
        );
        expect(mockShowErrorToast).toHaveBeenCalledWith(
          mockError.processedError
        );
      });
    });

    test('sets error on 401 error during fetch', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      const unauthorizedMessage =
        'Your session has expired. Please log in again.';
      const mockError = {
        processedError: {
          message: unauthorizedMessage,
          severity: 'high',
          shouldLogout: true,
        },
      };
      projectApiService.getAllProjects.mockRejectedValue(mockError);

      renderTestComponent(authValue);
      await user.click(screen.getByTestId('fetch-projects-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent(
          unauthorizedMessage
        );
        expect(mockShowErrorToast).toHaveBeenCalledWith(
          mockError.processedError
        );
      });
    });
  });

  describe('addProject', () => {
    const projectAlphaData = { name: 'New Project Alpha' };
    const projectAlphaResponse = { id: 'newP1', ...projectAlphaData };
    const projectBetaData = { name: 'New Project Beta' };
    const projectBetaResponse = { id: 'newP2', ...projectBetaData };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupAddProjectTest = (authValue) => {
      render(
        <ErrorProvider>
          <AuthContext.Provider value={authValue}>
            <ProjectProvider>
              <TestProjectConsumer />
              <ContextGrabber />
            </ProjectProvider>
          </AuthContext.Provider>
        </ErrorProvider>
      );
    };

    test('adds a new project successfully via button click', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      projectApiService.createProjectAPI.mockResolvedValue(
        projectAlphaResponse
      );
      setupAddProjectTest(authValue);

      await user.click(screen.getByTestId('add-project-button'));

      await waitFor(() => {
        expect(projectApiService.createProjectAPI).toHaveBeenCalledWith(
          projectAlphaData
        );
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([projectAlphaResponse])
        );
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Project created successfully!'
        );
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
    });

    test('prepends multiple projects correctly', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      setupAddProjectTest(authValue);

      projectApiService.createProjectAPI.mockResolvedValueOnce(
        projectAlphaResponse
      );
      await user.click(screen.getByTestId('add-project-button')); // Adds Alpha

      await waitFor(() =>
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([projectAlphaResponse])
        )
      );

      projectApiService.createProjectAPI.mockResolvedValueOnce(
        projectBetaResponse
      );
      // Add Beta directly via context
      await act(async () => {
        await projectContextInstance.addProject(projectBetaData);
      });

      await waitFor(() => {
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([projectBetaResponse, projectAlphaResponse])
        );
        expect(mockShowSuccess).toHaveBeenCalledTimes(2);
      });
    });

    test('handles error when adding project', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      const fallbackMessage = 'Failed to create project.';
      projectApiService.createProjectAPI.mockRejectedValue(
        new Error('Failed to create')
      );
      setupAddProjectTest(authValue);

      await user.click(screen.getByTestId('add-project-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(fallbackMessage);
        expect(mockShowErrorToast).toHaveBeenCalledWith({
          message: fallbackMessage,
          severity: 'medium',
        });
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([])
        ); // Projects list remains empty
      });
    });
  });

  describe('updateProject', () => {
    const initialProject = { id: 'p1', name: 'Initial Project P1' };
    const projectToUpdateData = { name: 'Updated Project P1' };
    const updatedProjectResponse = { id: 'p1', ...projectToUpdateData };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupUpdateProjectTest = (authValue) => {
      render(
        <ErrorProvider>
          <AuthContext.Provider value={authValue}>
            <ProjectProvider>
              <TestProjectConsumer />
              <ContextGrabber />
            </ProjectProvider>
          </AuthContext.Provider>
        </ErrorProvider>
      );
    };

    test('updates an existing project successfully via button click', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue);

      // First, add the project to be updated
      projectApiService.createProjectAPI.mockResolvedValueOnce(initialProject);
      await act(async () => {
        await projectContextInstance.addProject({ name: initialProject.name });
      });
      await waitFor(() =>
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([initialProject])
        )
      );
      mockShowSuccess.mockClear(); // Clear toast from addProject

      projectApiService.updateProjectAPI.mockResolvedValue(
        updatedProjectResponse
      );
      await user.click(screen.getByTestId('update-project-button')); // Button updates "p1"

      await waitFor(() => {
        expect(projectApiService.updateProjectAPI).toHaveBeenCalledWith(
          initialProject.id,
          projectToUpdateData
        );
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([updatedProjectResponse])
        );
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Project updated successfully!'
        );
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
    });

    test('handles error when updating project', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue);
      projectApiService.createProjectAPI.mockResolvedValueOnce(initialProject);
      await act(async () => {
        await projectContextInstance.addProject({ name: initialProject.name });
      });
      await waitFor(() =>
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([initialProject])
        )
      );
      mockShowSuccess.mockClear();
      mockShowErrorToast.mockClear();

      const fallbackMessage = 'Failed to update project.';
      projectApiService.updateProjectAPI.mockRejectedValue(
        new Error('Failed to update')
      );

      // Attempt update via button
      await user.click(screen.getByTestId('update-project-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(fallbackMessage);
        expect(mockShowErrorToast).toHaveBeenCalledWith({
          message: fallbackMessage,
          severity: 'medium',
        });
        // Projects list should remain as it was before the failed update
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([initialProject])
        );
      });
    });

    test('does not change list if updating non-existent project (API error)', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue); // Start with empty projects
      const nonExistentId = 'pNonExistent';
      const nonExistentUpdateData = { name: 'Non Existent' };
      const fallbackMessage = 'Failed to update project.';
      projectApiService.updateProjectAPI.mockRejectedValue(
        new Error('Project not found')
      );

      let caughtError = null;

      // Attempt to update a non-existent project directly
      await act(async () => {
        try {
          await projectContextInstance.updateProject(
            nonExistentId,
            nonExistentUpdateData
          );
        } catch (e) {
          caughtError = e; // Capture error to assert outside act's callback
        }
      });

      // Assert that an error was caught
      expect(caughtError).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(fallbackMessage);
        expect(mockShowErrorToast).toHaveBeenCalledWith({
          message: fallbackMessage,
          severity: 'medium',
        });
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([])
        ); // List remains empty
      });
    });
  });

  describe('deleteProject', () => {
    const project1ToDelete = { id: 'p1', name: 'Project One to Delete' };
    const project2ToKeep = { id: 'p2', name: 'Project Two to Keep' };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupDeleteTest = async (authValue) => {
      render(
        <ErrorProvider>
          <AuthContext.Provider value={authValue}>
            <ProjectProvider>
              <TestProjectConsumer />
              <ContextGrabber />
            </ProjectProvider>
          </AuthContext.Provider>
        </ErrorProvider>
      );
      // Pre-populate projects
      projectApiService.createProjectAPI.mockResolvedValueOnce(project2ToKeep);
      await act(async () => {
        await projectContextInstance.addProject({ name: project2ToKeep.name });
      });
      projectApiService.createProjectAPI.mockResolvedValueOnce(
        project1ToDelete
      );
      await act(async () => {
        await projectContextInstance.addProject({
          name: project1ToDelete.name,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([project1ToDelete, project2ToKeep]) // p1 added last, so it's first
        );
      });
      mockShowSuccess.mockClear(); // Clear toasts from addProject calls
    };

    test('successfully deletes a project via button click', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      projectApiService.deleteProjectAPI.mockResolvedValue(undefined);

      await user.click(screen.getByTestId('delete-project-button')); // Deletes "p1"

      await waitFor(() => {
        expect(projectApiService.deleteProjectAPI).toHaveBeenCalledWith(
          project1ToDelete.id
        );
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([project2ToKeep]) // Only p2 remains
        );
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Project deleted successfully!'
        );
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });

    test('sets error on generic API failure during delete', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const fallbackMessage = 'Failed to delete project.';
      projectApiService.deleteProjectAPI.mockRejectedValue(
        new Error('Network Error on delete')
      );

      await user.click(screen.getByTestId('delete-project-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent(fallbackMessage);
        expect(mockShowErrorToast).toHaveBeenCalledWith({
          message: fallbackMessage,
          severity: 'medium',
        });
        // Projects list should remain unchanged on error
        expect(screen.getByTestId('projects')).toHaveTextContent(
          JSON.stringify([project1ToDelete, project2ToKeep])
        );
      });
    });

    test('sets error from err.processedError on API delete error', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const processedErrorMessage = 'API specific delete error';
      const mockError = {
        processedError: {
          message: processedErrorMessage,
          severity: 'medium',
        },
      };
      projectApiService.deleteProjectAPI.mockRejectedValue(mockError);

      await user.click(screen.getByTestId('delete-project-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent(
          processedErrorMessage
        );
        expect(mockShowErrorToast).toHaveBeenCalledWith(
          mockError.processedError
        );
      });
    });

    test('sets error on 401 error during delete', async () => {
      const authValue = {
        isAuthenticated: true,
        token: 'test-token',
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const unauthorizedMessage =
        'Your session has expired. Please log in again.';
      const mockError = {
        processedError: {
          message: unauthorizedMessage,
          severity: 'high',
          shouldLogout: true,
        },
      };
      projectApiService.deleteProjectAPI.mockRejectedValue(mockError);

      await user.click(screen.getByTestId('delete-project-button'));

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent(
          unauthorizedMessage
        );
        expect(mockShowErrorToast).toHaveBeenCalledWith(
          mockError.processedError
        );
      });
    });
  });
});
