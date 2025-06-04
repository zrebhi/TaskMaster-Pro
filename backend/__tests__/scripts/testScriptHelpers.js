/**
 * Test Script Helpers
 * Centralized helper functions for API test scripts
 */

const axios = require('axios');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

/**
 * Print colored output to console
 * @param {string} color - Color name from colors object
 * @param {string} message - Message to print
 */
function printStatus(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test HTTP response against expected status
 * @param {string} description - Test description
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {number} actualStatus - Actual HTTP status code
 * @param {any} responseData - Response data for error reporting
 * @returns {boolean} - True if test passed, false otherwise
 */
function testResponse(description, expectedStatus, actualStatus, responseData) {
  if (actualStatus === expectedStatus) {
    printStatus('green', `✅ ${description} (Status: ${actualStatus})`);
    return true;
  } else {
    printStatus('red', `❌ ${description}`);
    printStatus('red', `   Expected: ${expectedStatus}, Got: ${actualStatus}`);
    printStatus('red', `   Response: ${JSON.stringify(responseData)}`);
    return false;
  }
}

/**
 * Check if server is running on the specified base URL
 * @param {string} baseUrl - Base URL to check
 * @returns {Promise<boolean>} - True if server is running
 */
async function checkServer(baseUrl) {
  printStatus('blue', '🔍 Checking if server is running...');
  try {
    // Try a simple POST to login endpoint (which should return 400 for missing body)
    await axios.post(`${baseUrl}/auth/login`, {});
    printStatus('green', '✅ Server is running');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      printStatus('red', '❌ Server is not running');
      printStatus('yellow', 'Please start the server with: npm start');
      return false;
    }
    // Server is running but returned an error (which is expected for empty login request)
    printStatus('green', '✅ Server is running');
    return true;
  }
}

/**
 * Generate unique test identifiers
 * @param {string} prefix - Prefix for the identifier
 * @returns {object} - Object with username and email
 */
function generateTestUser(prefix = 'testuser') {
  const timestamp = Date.now();
  return {
    username: `${prefix}_${timestamp}`,
    email: `${prefix}_${timestamp}@example.com`,
  };
}

/**
 * Register a new test user
 * @param {string} baseUrl - Base API URL
 * @param {string} username - Username for registration
 * @param {string} email - Email for registration
 * @param {string} password - Password for registration
 * @returns {Promise<object>} - Registration response data
 */
async function registerUser(
  baseUrl,
  username,
  email,
  password = 'password123'
) {
  const response = await axios.post(`${baseUrl}/auth/register`, {
    username,
    email,
    password,
  });

  if (response.status !== 201) {
    throw new Error(`Failed to register user: ${response.status}`);
  }

  return response.data;
}

/**
 * Login user and get authentication token
 * @param {string} baseUrl - Base API URL
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} - JWT token
 */
async function loginUser(baseUrl, email, password = 'password123') {
  const response = await axios.post(`${baseUrl}/auth/login`, {
    email,
    password,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to login user: ${response.status}`);
  }

  return response.data.token;
}

/**
 * Create a test user and return authentication token
 * @param {string} baseUrl - Base API URL
 * @param {string} prefix - Prefix for username/email
 * @returns {Promise<object>} - Object with token and user info
 */
async function createTestUser(baseUrl, prefix = 'testuser') {
  const userInfo = generateTestUser(prefix);

  await registerUser(baseUrl, userInfo.username, userInfo.email);
  const token = await loginUser(baseUrl, userInfo.email);

  return {
    token,
    username: userInfo.username,
    email: userInfo.email,
  };
}

/**
 * Get or create reusable test users (creates once, reuses on subsequent calls)
 * @param {string} baseUrl - Base API URL
 * @returns {Promise<object>} - Object with primaryUser and secondaryUser
 */
async function getReusableTestUsers(baseUrl) {
  // Static users that persist across test runs
  const primaryUserInfo = {
    username: 'testuser_primary',
    email: 'testuser_primary@example.com',
    password: 'password123',
  };

  const secondaryUserInfo = {
    username: 'testuser_secondary',
    email: 'testuser_secondary@example.com',
    password: 'password123',
  };

  try {
    // Try to login existing users first
    const primaryToken = await loginUser(
      baseUrl,
      primaryUserInfo.email,
      primaryUserInfo.password
    );
    const secondaryToken = await loginUser(
      baseUrl,
      secondaryUserInfo.email,
      secondaryUserInfo.password
    );

    return {
      primaryUser: {
        token: primaryToken,
        username: primaryUserInfo.username,
        email: primaryUserInfo.email,
      },
      secondaryUser: {
        token: secondaryToken,
        username: secondaryUserInfo.username,
        email: secondaryUserInfo.email,
      },
    };
  } catch {
    // Users don't exist, create them
    printStatus('blue', '🔧 Creating reusable test users...');

    try {
      await registerUser(
        baseUrl,
        primaryUserInfo.username,
        primaryUserInfo.email,
        primaryUserInfo.password
      );
    } catch {
      // User might already exist, ignore registration error
    }

    try {
      await registerUser(
        baseUrl,
        secondaryUserInfo.username,
        secondaryUserInfo.email,
        secondaryUserInfo.password
      );
    } catch {
      // User might already exist, ignore registration error
    }

    // Login both users
    const primaryToken = await loginUser(
      baseUrl,
      primaryUserInfo.email,
      primaryUserInfo.password
    );
    const secondaryToken = await loginUser(
      baseUrl,
      secondaryUserInfo.email,
      secondaryUserInfo.password
    );

    printStatus('green', '✅ Reusable test users ready');

    return {
      primaryUser: {
        token: primaryToken,
        username: primaryUserInfo.username,
        email: primaryUserInfo.email,
      },
      secondaryUser: {
        token: secondaryToken,
        username: secondaryUserInfo.username,
        email: secondaryUserInfo.email,
      },
    };
  }
}

/**
 * Create a test project
 * @param {string} baseUrl - Base API URL
 * @param {string} token - Authentication token
 * @param {string} name - Project name
 * @returns {Promise<object>} - Project data
 */
async function createTestProject(baseUrl, token, name = 'Test Project') {
  const response = await axios.post(
    `${baseUrl}/projects`,
    {
      name,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create project: ${response.status}`);
  }

  return response.data.project;
}

/**
 * Create a test task
 * @param {string} baseUrl - Base API URL
 * @param {string} token - Authentication token
 * @param {string} projectId - Project ID
 * @param {object} taskData - Task data
 * @returns {Promise<object>} - Task data
 */
async function createTestTask(baseUrl, token, projectId, taskData = {}) {
  const defaultTaskData = {
    title: 'Test Task',
    description: 'Test task description',
    priority: 2,
    ...taskData,
  };

  const response = await axios.post(
    `${baseUrl}/projects/${projectId}/tasks`,
    defaultTaskData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create task: ${response.status}`);
  }

  return response.data.task;
}

/**
 * Setup complete test environment (user, project, task)
 * @param {string} baseUrl - Base API URL
 * @param {string} userPrefix - Prefix for test user
 * @param {string} projectName - Project name
 * @param {object} taskData - Task data
 * @returns {Promise<object>} - Complete test setup
 */
async function setupTestEnvironment(
  baseUrl,
  userPrefix = 'testuser',
  projectName = 'Test Project',
  taskData = {}
) {
  printStatus('blue', '📋 Setting up test environment...');

  // Create user and get token
  const user = await createTestUser(baseUrl, userPrefix);
  printStatus('green', `✅ Test user created: ${user.username}`);

  // Create project
  const project = await createTestProject(baseUrl, user.token, projectName);
  printStatus('green', `✅ Test project created: ${project.id}`);

  // Create task
  const task = await createTestTask(baseUrl, user.token, project.id, taskData);
  printStatus('green', `✅ Test task created: ${task.id}`);

  return {
    user,
    project,
    task,
  };
}

/**
 * Make authenticated API request
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {string} token - Authentication token
 * @param {object} data - Request data (for POST/PUT)
 * @returns {Promise<object>} - Axios response
 */
async function makeAuthenticatedRequest(method, url, token, data = null) {
  const config = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
    config.data = data;
  }

  return axios(config);
}

/**
 * Test API endpoint with error handling
 * @param {string} description - Test description
 * @param {number} expectedStatus - Expected HTTP status
 * @param {Function} requestFunction - Function that makes the API request
 * @returns {Promise<boolean>} - True if test passed
 */
async function testApiEndpoint(description, expectedStatus, requestFunction) {
  try {
    const response = await requestFunction();
    return testResponse(
      description,
      expectedStatus,
      response.status,
      response.data
    );
  } catch (error) {
    const actualStatus = error.response?.status || 'ERROR';
    const responseData = error.response?.data || error.message;
    return testResponse(
      description,
      expectedStatus,
      actualStatus,
      responseData
    );
  }
}

/**
 * Print test section header
 * @param {string} title - Section title
 */
function printTestSection(title) {
  console.log();
  printStatus('yellow', title);
}

/**
 * Print test summary
 * @param {string} title - Summary title
 * @param {Array<string>} testCases - List of test cases
 */
function printTestSummary(title, testCases) {
  console.log();
  printStatus('blue', '📊 Test Summary');
  printStatus('green', `✅ ${title}`);
  printStatus('blue', '📋 Test Cases Covered:');
  testCases.forEach((testCase) => {
    console.log(`   ✅ ${testCase}`);
  });
  console.log();
  printStatus('green', '🎉 API testing completed successfully!');
}

/**
 * Delete a task by ID
 * @param {string} baseUrl - Base API URL
 * @param {string} token - Authentication token
 * @param {string} taskId - Task ID to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteTask(baseUrl, token, taskId) {
  try {
    const response = await axios.delete(`${baseUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status === 200;
  } catch {
    // Task might already be deleted or not exist, which is fine for cleanup
    return true;
  }
}

/**
 * Delete a project by ID (also deletes associated tasks via CASCADE)
 * @param {string} baseUrl - Base API URL
 * @param {string} token - Authentication token
 * @param {string} projectId - Project ID to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteProject(baseUrl, token, projectId) {
  try {
    const response = await axios.delete(`${baseUrl}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status === 200;
  } catch {
    // Project might already be deleted or not exist, which is fine for cleanup
    return true;
  }
}

/**
 * Clean up test data by deleting tasks and projects
 * @param {string} baseUrl - Base API URL
 * @param {string} token - Authentication token
 * @param {Array<string>} taskIds - Array of task IDs to delete
 * @param {Array<string>} projectIds - Array of project IDs to delete
 * @returns {Promise<object>} - Cleanup results
 */
async function cleanupTestData(baseUrl, token, taskIds = [], projectIds = []) {
  printStatus('blue', '🧹 Cleaning up test data...');

  const results = {
    tasksDeleted: 0,
    projectsDeleted: 0,
    errors: [],
  };

  // Delete individual tasks first (if any)
  for (const taskId of taskIds) {
    try {
      const success = await deleteTask(baseUrl, token, taskId);
      if (success) {
        results.tasksDeleted++;
      }
    } catch (error) {
      results.errors.push(`Failed to delete task ${taskId}: ${error.message}`);
    }
  }

  // Delete projects (this will also delete associated tasks via CASCADE)
  for (const projectId of projectIds) {
    try {
      const success = await deleteProject(baseUrl, token, projectId);
      if (success) {
        results.projectsDeleted++;
      }
    } catch (error) {
      results.errors.push(
        `Failed to delete project ${projectId}: ${error.message}`
      );
    }
  }

  // Report cleanup results
  if (results.projectsDeleted > 0) {
    printStatus('green', `✅ Cleaned up ${results.projectsDeleted} project(s)`);
  }
  if (results.tasksDeleted > 0) {
    printStatus(
      'green',
      `✅ Cleaned up ${results.tasksDeleted} individual task(s)`
    );
  }
  if (results.errors.length > 0) {
    printStatus(
      'yellow',
      `⚠️ ${results.errors.length} cleanup error(s) (may be expected)`
    );
  }
  if (results.projectsDeleted === 0 && results.tasksDeleted === 0) {
    printStatus('blue', '📝 No test data to clean up');
  }

  return results;
}

/**
 * Test data tracker to keep track of created resources for cleanup
 */
class TestDataTracker {
  constructor() {
    this.taskIds = [];
    this.projectIds = [];
  }

  /**
   * Track a created task
   * @param {string} taskId - Task ID to track
   */
  trackTask(taskId) {
    if (taskId && !this.taskIds.includes(taskId)) {
      this.taskIds.push(taskId);
    }
  }

  /**
   * Track a created project
   * @param {string} projectId - Project ID to track
   */
  trackProject(projectId) {
    if (projectId && !this.projectIds.includes(projectId)) {
      this.projectIds.push(projectId);
    }
  }

  /**
   * Clean up all tracked test data
   * @param {string} baseUrl - Base API URL
   * @param {string} token - Authentication token
   * @returns {Promise<object>} - Cleanup results
   */
  async cleanup(baseUrl, token) {
    const results = await cleanupTestData(
      baseUrl,
      token,
      this.taskIds,
      this.projectIds
    );

    // Clear tracking arrays after cleanup
    this.taskIds = [];
    this.projectIds = [];

    return results;
  }

  /**
   * Get summary of tracked data
   * @returns {object} - Summary of tracked resources
   */
  getSummary() {
    return {
      tasks: this.taskIds.length,
      projects: this.projectIds.length,
      total: this.taskIds.length + this.projectIds.length,
    };
  }
}

module.exports = {
  colors,
  printStatus,
  testResponse,
  checkServer,
  generateTestUser,
  registerUser,
  loginUser,
  createTestUser,
  getReusableTestUsers,
  createTestProject,
  createTestTask,
  setupTestEnvironment,
  makeAuthenticatedRequest,
  testApiEndpoint,
  printTestSection,
  printTestSummary,
  // Cleanup helpers
  deleteTask,
  deleteProject,
  cleanupTestData,
  TestDataTracker,
};
