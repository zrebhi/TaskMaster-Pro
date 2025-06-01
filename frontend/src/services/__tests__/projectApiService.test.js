const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

jest.mock('../apiClient', () => ({
  api: mockApi,
}));

const {
  getAllProjects,
  createProjectAPI,
  updateProjectAPI,
  deleteProjectAPI,
} = require('../projectApiService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAllProjects Function Tests', () => {
  it('should fetch projects successfully and return response.data.projects', async () => {
    // Arrange
    const mockProjects = [
      { id: 1, name: 'Project 1', description: 'Description 1' },
      { id: 2, name: 'Project 2', description: 'Description 2' },
    ];
    const mockResponse = {
      data: {
        projects: mockProjects,
        total: 2,
      },
    };
    mockApi.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
    expect(result).toEqual(mockProjects);
  });

  it('should fetch projects successfully and return response.data if response.data.projects is not present', async () => {
    // Arrange
    const mockProjects = [
      { id: 1, name: 'Project 1', description: 'Description 1' },
      { id: 2, name: 'Project 2', description: 'Description 2' },
    ];
    const mockResponse = {
      data: mockProjects,
    };
    mockApi.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
    expect(result).toEqual(mockProjects);
  });

  it('should handle API error (e.g., 400, 500) and throw the error response data', async () => {
    // Arrange
    const mockErrorResponse = {
      response: {
        data: {
          message: 'Unauthorized access',
          status: 401,
        },
      },
    };
    mockApi.get.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(mockErrorResponse);
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const networkError = new Error('Network Error');
    mockApi.get.mockRejectedValue(networkError);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(networkError);
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
  });

  it('should handle API error without error message and use error.message as fallback', async () => {
    // Arrange
    const mockErrorResponse = {
      response: {
        data: {
          status: 500,
        },
      },
      message: 'Internal Server Error',
    };
    mockApi.get.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(mockErrorResponse);
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
  });

  it('should handle empty projects array response', async () => {
    // Arrange
    const mockResponse = {
      data: {
        projects: [],
        total: 0,
      },
    };
    mockApi.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
    expect(result).toEqual([]);
  });

  it('should handle API response where response.data is null', async () => {
    // Arrange
    const mockResponse = { data: null };
    mockApi.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
    expect(result).toBeNull();
  });

  it('should handle API response where response.data is undefined', async () => {
    // Arrange
    const mockResponse = { data: undefined };
    mockApi.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApi.get).toHaveBeenCalledWith('/projects', 'fetching projects');
    expect(result).toBeUndefined();
  });
});

describe('createProjectAPI Function Tests', () => {
  it('should create a project successfully and return response.data.project', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const mockCreatedProject = {
      id: 3,
      name: 'New Project',
      description: 'New Description',
    };
    const mockResponse = {
      data: {
        project: mockCreatedProject,
      },
    };
    mockApi.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApi.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
      'creating project'
    );
    expect(result).toEqual(mockCreatedProject);
  });

  it('should create a project successfully and return response.data if response.data.project is not present', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const mockCreatedProject = {
      id: 3,
      name: 'New Project',
      description: 'New Description',
    };
    const mockResponse = {
      data: mockCreatedProject,
    };
    mockApi.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApi.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
      'creating project'
    );
    expect(result).toEqual(mockCreatedProject);
  });

  it('should handle API error and throw the error object', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const mockErrorResponse = {
      response: {
        data: {
          message: 'Validation Error',
          status: 400,
        },
      },
    };
    mockApi.post.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(createProjectAPI(mockProjectData)).rejects.toEqual(
      mockErrorResponse
    );
    expect(mockApi.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
      'creating project'
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const networkError = new Error('Network Error');
    mockApi.post.mockRejectedValue(networkError);

    // Act & Assert
    await expect(createProjectAPI(mockProjectData)).rejects.toEqual(
      networkError
    );
    expect(mockApi.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
      'creating project'
    );
  });
  it('should handle API response where response.data is null', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const mockResponse = { data: null };
    mockApi.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApi.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
      'creating project'
    );
    expect(result).toBeNull();
  });
});

describe('updateProjectAPI Function Tests', () => {
  it('should update a project successfully and return response.data.project', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const mockUpdatedProject = { id: projectId, ...mockProjectData };
    const mockResponse = {
      data: {
        project: mockUpdatedProject,
      },
    };
    mockApi.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApi.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
      'updating project'
    );
    expect(result).toEqual(mockUpdatedProject);
  });

  it('should update a project successfully and return response.data if response.data.project is not present', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const mockUpdatedProject = { id: projectId, ...mockProjectData };
    const mockResponse = {
      data: mockUpdatedProject,
    };
    mockApi.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApi.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
      'updating project'
    );
    expect(result).toEqual(mockUpdatedProject);
  });

  it('should handle API response where response.data is null', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const mockResponse = { data: null };
    mockApi.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApi.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
      'updating project'
    );
    expect(result).toBeNull();
  });

  it('should handle API error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const mockErrorResponse = {
      response: {
        data: {
          message: 'Update failed',
          status: 400,
        },
      },
    };
    mockApi.put.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(updateProjectAPI(projectId, mockProjectData)).rejects.toEqual(
      mockErrorResponse
    );
    expect(mockApi.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
      'updating project'
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const networkError = new Error('Network Error');
    mockApi.put.mockRejectedValue(networkError);

    // Act & Assert
    await expect(updateProjectAPI(projectId, mockProjectData)).rejects.toEqual(
      networkError
    );
    expect(mockApi.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
      'updating project'
    );
  });
});

describe('deleteProjectAPI Function Tests', () => {
  it('should delete a project successfully and return response.data', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockResponse = { data: { message: 'Deleted successfully' } };
    mockApi.delete.mockResolvedValue(mockResponse);

    // Act
    const result = await deleteProjectAPI(projectId);

    // Assert
    expect(mockApi.delete).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      'deleting project'
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle successful deletion with 204 No Content (empty response.data)', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockResponse = { data: undefined };
    mockApi.delete.mockResolvedValue(mockResponse);

    // Act
    const result = await deleteProjectAPI(projectId);

    // Assert
    expect(mockApi.delete).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      'deleting project'
    );
    expect(result).toBeUndefined();
  });

  it('should handle API error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockErrorResponse = {
      response: {
        data: {
          message: 'Deletion failed',
          status: 400,
        },
      },
    };
    mockApi.delete.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(deleteProjectAPI(projectId)).rejects.toEqual(
      mockErrorResponse
    );
    expect(mockApi.delete).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      'deleting project'
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const networkError = new Error('Network Error');
    mockApi.delete.mockRejectedValue(networkError);

    // Act & Assert
    await expect(deleteProjectAPI(projectId)).rejects.toEqual(networkError);
    expect(mockApi.delete).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      'deleting project'
    );
  });
});
