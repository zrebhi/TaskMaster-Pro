const jwt = require('jsonwebtoken');

/**
 * Create mock user data for unit tests
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user object
 */
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  ...overrides,
});

/**
 * Create mock project data for unit tests
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock project object
 */
const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  name: 'Test Project',
  user_id: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),
  destroy: jest.fn(),
  ...overrides,
});

/**
 * Create mock task data for unit tests
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock task object
 */
const createMockTask = (overrides = {}) => ({
  id: 'task-123',
  project_id: 'project-123',
  title: 'Test Task',
  description: 'Test description',
  due_date: '2024-12-31',
  priority: 2,
  is_completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),
  Project: {
    id: 'project-123',
    user_id: 'user-123',
    name: 'Test Project',
  },
  ...overrides,
});

/**
 * Setup JWT mocks for unit tests
 * @returns {Object} Mock token and decoded token
 */
const setupJWTMocks = () => {
  const mockToken = 'mock.jwt.token';
  const mockDecodedToken = { exp: 1234567890 };
  jwt.sign.mockReturnValue(mockToken);
  jwt.decode.mockReturnValue(mockDecodedToken);
  return { mockToken, mockDecodedToken };
};

/**
 * Create standard mock request/response/next objects
 * @param {Object} reqOverrides - Request object overrides
 * @returns {Object} Mock req, res, next objects
 */
const createMockReqResNext = (reqOverrides = {}) => {
  const mockReq = {
    body: {},
    user: { userId: 'user-123' },
    params: {},
    ...reqOverrides,
  };

  const mockRes = {
    status: jest.fn(() => mockRes),
    json: jest.fn(() => mockRes),
  };

  const mockNext = jest.fn();

  return { mockReq, mockRes, mockNext };
};

/**
 * Setup common mocks for asyncHandler
 */
const setupAsyncHandlerMock = () => {
  jest.mock('../../../utils/customErrors', () => {
    const actual = jest.requireActual('../../../utils/customErrors');
    return {
      ...actual,
      asyncHandler: (fn) => fn,
    };
  });
};

module.exports = {
  createMockUser,
  createMockProject,
  createMockTask,
  setupJWTMocks,
  createMockReqResNext,
  setupAsyncHandlerMock,
};
