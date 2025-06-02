import * as projectApiService from '../../../services/projectApiService';
import { projectApiMocks, errorApiMocks } from '../../helpers/api-mocks';

// Mock the apiClient
jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('projectApiService Unit Tests', () => {
  let mockApi;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = require('../../../services/apiClient').api;
  });

  describe('getAllProjects', () => {
    test('returns projects array on successful response', async () => {
      const projectsResponse = projectApiMocks.getAllSuccess();
      mockApi.get.mockResolvedValue({ data: projectsResponse });

      const result = await projectApiService.getAllProjects();

      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects',
        'fetching projects'
      );
      expect(result).toEqual(projectsResponse.projects);
    });

    test('returns data directly when no projects wrapper', async () => {
      const projectsArray = projectApiMocks.getAllSuccess().projects;
      mockApi.get.mockResolvedValue({ data: projectsArray });

      const result = await projectApiService.getAllProjects();

      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects',
        'fetching projects'
      );
      expect(result).toEqual(projectsArray);
    });

    test('throws error when API call fails', async () => {
      const apiError = new Error('Server error');
      mockApi.get.mockRejectedValue(apiError);

      await expect(projectApiService.getAllProjects()).rejects.toThrow(
        'Server error'
      );
      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects',
        'fetching projects'
      );
    });
  });

  describe('createProjectAPI', () => {
    test('returns created project on successful response', async () => {
      const projectData = { name: 'New Project' };
      const createResponse = projectApiMocks.createSuccess({
        name: 'New Project',
      });
      mockApi.post.mockResolvedValue({ data: createResponse });

      const result = await projectApiService.createProjectAPI(projectData);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/projects',
        projectData,
        'creating project'
      );
      expect(result).toEqual(createResponse.project);
    });

    test('returns data directly when no project wrapper', async () => {
      const projectData = { name: 'New Project' };
      const createdProject = projectApiMocks.createSuccess({
        name: 'New Project',
      }).project;
      mockApi.post.mockResolvedValue({ data: createdProject });

      const result = await projectApiService.createProjectAPI(projectData);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/projects',
        projectData,
        'creating project'
      );
      expect(result).toEqual(createdProject);
    });

    test('throws error when API call fails', async () => {
      const projectData = { name: 'New Project' };
      const apiError = projectApiMocks.validationError(
        'Project name is required'
      );
      mockApi.post.mockRejectedValue(apiError);

      await expect(
        projectApiService.createProjectAPI(projectData)
      ).rejects.toThrow(apiError);
      expect(mockApi.post).toHaveBeenCalledWith(
        '/projects',
        projectData,
        'creating project'
      );
    });
  });

  describe('updateProjectAPI', () => {
    test('returns updated project on successful response', async () => {
      const projectId = 'project-123';
      const updateData = { name: 'Updated Project' };
      const updateResponse = projectApiMocks.updateSuccess(
        projectId,
        updateData
      );
      mockApi.put.mockResolvedValue({ data: updateResponse });

      const result = await projectApiService.updateProjectAPI(
        projectId,
        updateData
      );

      expect(mockApi.put).toHaveBeenCalledWith(
        `/projects/${projectId}`,
        updateData,
        'updating project'
      );
      expect(result).toEqual(updateResponse.project);
    });

    test('returns data directly when no project wrapper', async () => {
      const projectId = 'project-123';
      const updateData = { name: 'Updated Project' };
      const updatedProject = projectApiMocks.updateSuccess(
        projectId,
        updateData
      ).project;
      mockApi.put.mockResolvedValue({ data: updatedProject });

      const result = await projectApiService.updateProjectAPI(
        projectId,
        updateData
      );

      expect(mockApi.put).toHaveBeenCalledWith(
        `/projects/${projectId}`,
        updateData,
        'updating project'
      );
      expect(result).toEqual(updatedProject);
    });

    test('throws error when API call fails', async () => {
      const projectId = 'project-123';
      const updateData = { name: 'Updated Project' };
      const apiError = projectApiMocks.notFound();
      mockApi.put.mockRejectedValue(apiError);

      await expect(
        projectApiService.updateProjectAPI(projectId, updateData)
      ).rejects.toThrow(apiError);
      expect(mockApi.put).toHaveBeenCalledWith(
        `/projects/${projectId}`,
        updateData,
        'updating project'
      );
    });
  });

  describe('deleteProjectAPI', () => {
    test('returns response data on successful deletion', async () => {
      const projectId = 'project-123';
      const deleteResponse = projectApiMocks.deleteSuccess();
      mockApi.delete.mockResolvedValue({ data: deleteResponse });

      const result = await projectApiService.deleteProjectAPI(projectId);

      expect(mockApi.delete).toHaveBeenCalledWith(
        `/projects/${projectId}`,
        'deleting project'
      );
      expect(result).toEqual(deleteResponse);
    });

    test('throws error when API call fails', async () => {
      const projectId = 'project-123';
      const apiError = projectApiMocks.notFound();
      mockApi.delete.mockRejectedValue(apiError);

      await expect(
        projectApiService.deleteProjectAPI(projectId)
      ).rejects.toThrow(apiError);
      expect(mockApi.delete).toHaveBeenCalledWith(
        `/projects/${projectId}`,
        'deleting project'
      );
    });
  });

  describe('error handling', () => {
    test('handles validation errors properly', async () => {
      const projectData = { name: '' };
      const apiError = projectApiMocks.validationError(
        'Project name cannot be empty'
      );
      mockApi.post.mockRejectedValue(apiError);

      await expect(
        projectApiService.createProjectAPI(projectData)
      ).rejects.toThrow(apiError);
    });

    test('handles unauthorized errors properly', async () => {
      const apiError = projectApiMocks.unauthorized();
      mockApi.get.mockRejectedValue(apiError);

      await expect(projectApiService.getAllProjects()).rejects.toThrow(
        apiError
      );
    });

    test('handles network errors properly', async () => {
      const networkError = errorApiMocks.networkError();
      mockApi.get.mockRejectedValue(networkError);

      await expect(projectApiService.getAllProjects()).rejects.toThrow(
        networkError
      );
    });

    test('handles server errors properly', async () => {
      const serverError = errorApiMocks.serverError();
      mockApi.get.mockRejectedValue(serverError);

      await expect(projectApiService.getAllProjects()).rejects.toThrow(
        serverError
      );
    });
  });
});
