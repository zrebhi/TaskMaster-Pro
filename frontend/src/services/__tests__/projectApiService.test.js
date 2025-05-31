// Mock console.error to suppress expected error logs in tests
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

// Mock axios client that will be returned by axios.create
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

// Mock axios itself
const mockAxios = {
  create: jest.fn(() => mockApiClient),
};

// Mock the axios module before importing
jest.mock('axios', () => mockAxios);
// Import the service to trigger interceptor setup
require('../projectApiService');

// Extract interceptor functions for reuse in tests
const requestInterceptor =
  mockApiClient.interceptors.request.use.mock.calls[0]?.[0];

const {
  getAllProjects,
  createProjectAPI,
  updateProjectAPI,
  deleteProjectAPI,
} = require('../projectApiService');

beforeEach(() => {
  jest.clearAllMocks();
  // Clear sessionStorage before each test
  sessionStorage.clear();
});

afterAll(() => {
  mockConsoleError.mockRestore();
});

describe('Axios Interceptor Tests', () => {
  it('should add Authorization header with Bearer token if token exists in sessionStorage', () => {
    // Arrange
    const testToken = 'test-token-123';
    sessionStorage.setItem('token', testToken);

    const mockConfig = {
      headers: {},
      method: 'get',
      url: '/projects',
    };

    // Act
    const result = requestInterceptor(mockConfig);

    // Assert
    expect(sessionStorage.getItem('token')).toBe(testToken);
    expect(result.headers.Authorization).toBe(`Bearer ${testToken}`);
    expect(result).toBe(mockConfig); // Should return the same config object
  });

  it('should NOT add Authorization header if no token exists in sessionStorage', () => {
    // Arrange - sessionStorage is already cleared in beforeEach
    // No token set, so sessionStorage.getItem('token') will return null

    const mockConfig = {
      headers: {},
      method: 'get',
      url: '/projects',
    };

    // Act
    const result = requestInterceptor(mockConfig);

    // Assert
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(result.headers.Authorization).toBeUndefined();
    expect(result).toBe(mockConfig);
  });

  it('should handle request interceptor error', () => {
    // Arrange
    const testError = new Error('SessionStorage access error');
    const getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw testError;
      });

    const mockConfig = {
      headers: {},
      method: 'get',
      url: '/projects',
    };

    // Act & Assert
    expect(() => requestInterceptor(mockConfig)).toThrow(testError);
    expect(getItemSpy).toHaveBeenCalledWith('token');

    // Cleanup
    getItemSpy.mockRestore();
  });

  it('should preserve existing headers when adding Authorization header', () => {
    // Arrange
    const testToken = 'test-token-456';
    sessionStorage.setItem('token', testToken);

    const mockConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
      method: 'post',
      url: '/projects',
    };

    // Act
    const result = requestInterceptor(mockConfig);

    // Assert
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Custom-Header': 'custom-value',
      Authorization: `Bearer ${testToken}`,
    });
  });

  it('should handle empty string token as falsy value', () => {
    // Arrange
    sessionStorage.setItem('token', '');

    const mockConfig = {
      headers: {},
      method: 'get',
      url: '/projects',
    };

    // Act
    const result = requestInterceptor(mockConfig);

    // Assert
    expect(sessionStorage.getItem('token')).toBe('');
    expect(result.headers.Authorization).toBeUndefined();
    expect(result).toBe(mockConfig);
  });

  it('should reflect changes in sessionStorage token between requests', () => {
    // This test verifies that the interceptor reads the token fresh from sessionStorage on each request

    // Test first token
    sessionStorage.setItem('token', 'token1');
    const mockConfig1 = { headers: {} };
    const result1 = requestInterceptor(mockConfig1);
    expect(result1.headers.Authorization).toBe('Bearer token1');

    // Test second token - change sessionStorage and verify interceptor picks up new value
    sessionStorage.setItem('token', 'token2');
    const mockConfig2 = { headers: {} };
    const result2 = requestInterceptor(mockConfig2);
    expect(result2.headers.Authorization).toBe('Bearer token2');

    // Test no token
    sessionStorage.removeItem('token');
    const mockConfig3 = { headers: {} };
    const result3 = requestInterceptor(mockConfig3);
    expect(result3.headers.Authorization).toBeUndefined();
  });
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
    mockApiClient.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
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
    mockApiClient.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
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
    mockApiClient.get.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(
      mockErrorResponse.response.data,
    );
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error fetching projects:',
      'Unauthorized access',
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const networkError = new Error('Network Error');
    mockApiClient.get.mockRejectedValue(networkError);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(networkError);
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error fetching projects:',
      'Network Error',
    );
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
    mockApiClient.get.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(getAllProjects()).rejects.toEqual(
      mockErrorResponse.response.data,
    );
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error fetching projects:',
      'Internal Server Error',
    );
  });

  it('should handle empty projects array response', async () => {
    // Arrange
    const mockResponse = {
      data: {
        projects: [],
        total: 0,
      },
    };
    mockApiClient.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(result).toEqual([]);
  });

  it('should handle API response where response.data is null', async () => {
    // Arrange
    const mockResponse = { data: null };
    mockApiClient.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(result).toBeNull();
  });

  it('should handle API response where response.data is undefined', async () => {
    // Arrange
    const mockResponse = { data: undefined };
    mockApiClient.get.mockResolvedValue(mockResponse);

    // Act
    const result = await getAllProjects();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
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
    mockApiClient.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
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
    mockApiClient.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
    );
    expect(result).toEqual(mockCreatedProject);
  });

  it('should handle API error and throw the error response data', async () => {
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
    mockApiClient.post.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(createProjectAPI(mockProjectData)).rejects.toEqual(
      mockErrorResponse.response.data,
    );
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error creating project:',
      'Validation Error',
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const networkError = new Error('Network Error');
    mockApiClient.post.mockRejectedValue(networkError);

    // Act & Assert
    await expect(createProjectAPI(mockProjectData)).rejects.toEqual(
      networkError,
    );
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error creating project:',
      'Network Error',
    );
  });
  it('should handle API response where response.data is null', async () => {
    // Arrange
    const mockProjectData = { name: 'New Project' };
    const mockResponse = { data: null };
    mockApiClient.post.mockResolvedValue(mockResponse);

    // Act
    const result = await createProjectAPI(mockProjectData);

    // Assert
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects',
      mockProjectData,
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
    mockApiClient.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
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
    mockApiClient.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
    );
    expect(result).toEqual(mockUpdatedProject);
  });

  it('should handle API response where response.data is null', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const mockResponse = { data: null };
    mockApiClient.put.mockResolvedValue(mockResponse);

    // Act
    const result = await updateProjectAPI(projectId, mockProjectData);

    // Assert
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
    );
    expect(result).toBeNull();
  });

  it('should handle API error and throw error.response.data', async () => {
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
    mockApiClient.put.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(updateProjectAPI(projectId, mockProjectData)).rejects.toEqual(
      mockErrorResponse.response.data,
    );
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error updating project:',
      'Update failed',
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockProjectData = { name: 'Updated Name' };
    const networkError = new Error('Network Error');
    mockApiClient.put.mockRejectedValue(networkError);

    // Act & Assert
    await expect(updateProjectAPI(projectId, mockProjectData)).rejects.toEqual(
      networkError,
    );
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/projects/${projectId}`,
      mockProjectData,
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error updating project:',
      'Network Error',
    );
  });
});

describe('deleteProjectAPI Function Tests', () => {
  it('should delete a project successfully and return response.data', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockResponse = { data: { message: 'Deleted successfully' } };
    mockApiClient.delete.mockResolvedValue(mockResponse);

    // Act
    const result = await deleteProjectAPI(projectId);

    // Assert
    expect(mockApiClient.delete).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle successful deletion with 204 No Content (empty response.data)', async () => {
    // Arrange
    const projectId = 'project-id';
    const mockResponse = { data: undefined }; // Mimics 204 No Content
    mockApiClient.delete.mockResolvedValue(mockResponse);

    // Act
    const result = await deleteProjectAPI(projectId);

    // Assert
    expect(mockApiClient.delete).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(result).toBeUndefined();
  });

  it('should handle API error and throw error.response.data', async () => {
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
    mockApiClient.delete.mockRejectedValue(mockErrorResponse);

    // Act & Assert
    await expect(deleteProjectAPI(projectId)).rejects.toEqual(
      mockErrorResponse.response.data,
    );
    expect(mockApiClient.delete).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error deleting project:',
      'Deletion failed',
    );
  });

  it('should handle network error and throw the error object', async () => {
    // Arrange
    const projectId = 'project-id';
    const networkError = new Error('Network Error');
    mockApiClient.delete.mockRejectedValue(networkError);

    // Act & Assert
    await expect(deleteProjectAPI(projectId)).rejects.toEqual(networkError);
    expect(mockApiClient.delete).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error deleting project:',
      'Network Error',
    );
  });
});
