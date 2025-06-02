import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ProjectContext, {
  ProjectProvider,
} from '../../../context/ProjectContext';
import { setupSuccessfulProjectFlow } from '../../helpers/api-mocks';
import {
  createAuthenticatedContext,
  createUnauthenticatedContext,
} from '../../helpers/mock-providers';

jest.mock('../../../services/projectApiService');

const mockShowErrorToast = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('../../../context/ErrorContext', () => ({
  ...jest.requireActual('../../../context/ErrorContext'),
  useError: () => ({
    showErrorToast: mockShowErrorToast,
    showSuccess: mockShowSuccess,
    globalErrors: [],
    isOnline: true,
    addError: jest.fn(),
    removeError: jest.fn(),
    clearAllErrors: jest.fn(),
  }),
}));

jest.mock('../../../context/AuthContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.createContext(null),
  };
});

describe('ProjectContext Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowErrorToast.mockClear();
    mockShowSuccess.mockClear();
  });

  const createWrapper = (authContextValue = createAuthenticatedContext()) => {
    return ({ children }) => {
      const AuthContext = require('../../../context/AuthContext').default;

      return (
        <AuthContext.Provider value={authContextValue}>
          <ProjectProvider>{children}</ProjectProvider>
        </AuthContext.Provider>
      );
    };
  };

  const renderProjectContext = (
    authContextValue = createAuthenticatedContext()
  ) => {
    const wrapper = createWrapper(authContextValue);
    return renderHook(() => React.useContext(ProjectContext), { wrapper });
  };

  const testErrorHandling = async (
    operation,
    mockError,
    expectedErrorMessage,
    expectedToastCall
  ) => {
    const { result } = renderProjectContext();
    let thrownError;

    await act(async () => {
      try {
        await operation(result.current);
      } catch (error) {
        thrownError = error;
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(expectedErrorMessage);
    expect(thrownError).toBe(mockError);
    expect(mockShowErrorToast).toHaveBeenCalledWith(expectedToastCall);
  };

  describe('initial state', () => {
    test('provides correct initial state regardless of authentication', () => {
      const authenticatedResult = renderProjectContext();
      const unauthenticatedResult = renderProjectContext(
        createUnauthenticatedContext()
      );

      [authenticatedResult.result, unauthenticatedResult.result].forEach(
        (result) => {
          expect(result.current.projects).toEqual([]);
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBe(null);
          expect(typeof result.current.fetchProjects).toBe('function');
          expect(typeof result.current.addProject).toBe('function');
          expect(typeof result.current.updateProject).toBe('function');
          expect(typeof result.current.deleteProject).toBe('function');
        }
      );
    });
  });

  describe('fetchProjects', () => {
    test('does not call API when unauthenticated', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const { result } = renderProjectContext(createUnauthenticatedContext());

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(mocks.getAllProjects).not.toHaveBeenCalled();
      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('fetches projects successfully when authenticated', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const mockProjects = [
        { id: 'project-1', name: 'Test Project 1' },
        { id: 'project-2', name: 'Test Project 2' },
      ];
      mocks.getAllProjects.mockResolvedValue(mockProjects);

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(mocks.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('handles error with processedError during fetch', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const errorMessage = 'API specific error';
      const mockError = {
        processedError: {
          message: errorMessage,
          severity: 'medium',
        },
      };
      mocks.getAllProjects.mockRejectedValue(mockError);

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(mocks.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(mockShowErrorToast).toHaveBeenCalledWith(mockError.processedError);
    });

    test('handles generic error during fetch', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const fallbackMessage = 'Failed to fetch projects.';
      mocks.getAllProjects.mockRejectedValue(new Error('Network Error'));

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      expect(mocks.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(fallbackMessage);
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: fallbackMessage,
        severity: 'medium',
      });
    });
  });

  describe('addProject', () => {
    test('adds project successfully when authenticated', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectData = { name: 'New Project' };
      const newProject = { id: 'project-new', ...projectData };
      mocks.createProjectAPI.mockResolvedValue(newProject);

      const { result } = renderProjectContext();

      let returnedProject;
      await act(async () => {
        returnedProject = await result.current.addProject(projectData);
      });

      expect(mocks.createProjectAPI).toHaveBeenCalledWith(projectData);
      expect(result.current.projects).toEqual([newProject]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(returnedProject).toEqual(newProject);
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Project created successfully!'
      );
    });

    test('handles error with processedError during addProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectData = { name: 'New Project' };
      const errorMessage = 'Project creation failed';
      const mockError = {
        processedError: {
          message: errorMessage,
          severity: 'medium',
        },
      };
      mocks.createProjectAPI.mockRejectedValue(mockError);

      await testErrorHandling(
        (context) => context.addProject(projectData),
        mockError,
        errorMessage,
        mockError.processedError
      );

      expect(mocks.createProjectAPI).toHaveBeenCalledWith(projectData);
    });

    test('handles generic error during addProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectData = { name: 'New Project' };
      const fallbackMessage = 'Failed to create project.';
      const networkError = new Error('Network Error');
      mocks.createProjectAPI.mockRejectedValue(networkError);

      const { result } = renderProjectContext();
      let thrownError;

      await act(async () => {
        try {
          await result.current.addProject(projectData);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(mocks.createProjectAPI).toHaveBeenCalledWith(projectData);
      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(fallbackMessage);
      expect(thrownError).toBeInstanceOf(Error);
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: fallbackMessage,
        severity: 'medium',
      });
    });
  });

  describe('updateProject', () => {
    test('updates project successfully when authenticated', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const updateData = { name: 'Updated Project' };
      const updatedProject = { id: projectId, ...updateData };
      const initialProject = { id: projectId, name: 'Original Project' };

      mocks.getAllProjects.mockResolvedValue([initialProject]);
      mocks.updateProjectAPI.mockResolvedValue(updatedProject);

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      let returnedProject;
      await act(async () => {
        returnedProject = await result.current.updateProject(
          projectId,
          updateData
        );
      });

      expect(mocks.updateProjectAPI).toHaveBeenCalledWith(
        projectId,
        updateData
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(returnedProject).toEqual(updatedProject);
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Project updated successfully!'
      );
    });

    test('updates project in list with multiple projects', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-2';
      const updateData = { name: 'Updated Project 2' };
      const updatedProject = { id: projectId, ...updateData };
      const project1 = { id: 'project-1', name: 'Project 1' };
      const project2 = { id: projectId, name: 'Original Project 2' };
      const project3 = { id: 'project-3', name: 'Project 3' };

      mocks.getAllProjects.mockResolvedValue([project1, project2, project3]);
      mocks.updateProjectAPI.mockResolvedValue(updatedProject);

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      await act(async () => {
        await result.current.updateProject(projectId, updateData);
      });

      expect(mocks.updateProjectAPI).toHaveBeenCalledWith(
        projectId,
        updateData
      );
      expect(result.current.projects).toEqual([
        project1,
        updatedProject,
        project3,
      ]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Project updated successfully!'
      );
    });

    test('handles error during updateProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const updateData = { name: 'Updated Project' };
      const fallbackMessage = 'Failed to update project.';

      mocks.updateProjectAPI.mockRejectedValue(new Error('Network Error'));

      const { result } = renderProjectContext();
      let thrownError;

      await act(async () => {
        try {
          await result.current.updateProject(projectId, updateData);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(mocks.updateProjectAPI).toHaveBeenCalledWith(
        projectId,
        updateData
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(fallbackMessage);
      expect(thrownError).toBeInstanceOf(Error);
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: fallbackMessage,
        severity: 'medium',
      });
    });

    test('handles error with processedError during updateProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const updateData = { name: 'Updated Project' };
      const errorMessage = 'Update validation failed';
      const mockError = {
        processedError: {
          message: errorMessage,
          severity: 'medium',
        },
      };

      mocks.updateProjectAPI.mockRejectedValue(mockError);

      await testErrorHandling(
        (context) => context.updateProject(projectId, updateData),
        mockError,
        errorMessage,
        mockError.processedError
      );

      expect(mocks.updateProjectAPI).toHaveBeenCalledWith(
        projectId,
        updateData
      );
    });
  });

  describe('deleteProject', () => {
    test('deletes project successfully when authenticated', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const projectToDelete = { id: projectId, name: 'Project to Delete' };
      const projectToKeep = { id: 'project-2', name: 'Project to Keep' };

      mocks.getAllProjects.mockResolvedValue([projectToDelete, projectToKeep]);
      mocks.deleteProjectAPI.mockResolvedValue();

      const { result } = renderProjectContext();

      await act(async () => {
        await result.current.fetchProjects();
      });

      await act(async () => {
        await result.current.deleteProject(projectId);
      });

      expect(mocks.deleteProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.projects).toEqual([projectToKeep]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Project deleted successfully!'
      );
    });

    test('handles error during deleteProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const fallbackMessage = 'Failed to delete project.';

      mocks.deleteProjectAPI.mockRejectedValue(new Error('Network Error'));

      const { result } = renderProjectContext();
      let thrownError;

      await act(async () => {
        try {
          await result.current.deleteProject(projectId);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(mocks.deleteProjectAPI).toHaveBeenCalledWith(projectId);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(fallbackMessage);
      expect(thrownError).toBeInstanceOf(Error);
      expect(mockShowErrorToast).toHaveBeenCalledWith({
        message: fallbackMessage,
        severity: 'medium',
      });
    });

    test('handles error with processedError during deleteProject', async () => {
      const { mocks } = setupSuccessfulProjectFlow();
      const projectId = 'project-1';
      const errorMessage = 'Delete permission denied';
      const mockError = {
        processedError: {
          message: errorMessage,
          severity: 'high',
        },
      };

      mocks.deleteProjectAPI.mockRejectedValue(mockError);

      await testErrorHandling(
        (context) => context.deleteProject(projectId),
        mockError,
        errorMessage,
        mockError.processedError
      );

      expect(mocks.deleteProjectAPI).toHaveBeenCalledWith(projectId);
    });
  });
});
