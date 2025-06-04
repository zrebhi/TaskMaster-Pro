#!/usr/bin/env node

/**
 * Test Script for Update & Delete Task API Endpoints
 * This script tests all scenarios from the implementation plan using axios
 */

const axios = require('axios');
const {
  printStatus,
  testResponse,
  checkServer,
  getReusableTestUsers,
  createTestProject,
  createTestTask,
  testApiEndpoint,
  printTestSummary,
  TestDataTracker,
} = require('./testScriptHelpers');

const BASE_URL = 'http://localhost:3001/api';

// Main test function
async function runUpdateDeleteTaskTests() {
  printStatus('blue', '🧪 Starting Update & Delete Task API Tests...');
  console.log();

  // Check server
  const serverRunning = await checkServer(BASE_URL);
  if (!serverRunning) {
    throw new Error('Server is not running');
  }
  console.log();

  // Initialize test data tracker for cleanup
  const dataTracker = new TestDataTracker();
  let token; // Declare token in outer scope for cleanup access

  try {
    // Test Case Setup: Get reusable test users
    printStatus('blue', '📋 Setting up test data...');

    // Get reusable test users
    const users = await getReusableTestUsers(BASE_URL);
    const primaryUser = users.primaryUser;
    const secondaryUser = users.secondaryUser;
    token = primaryUser.token;
    printStatus('green', '✅ Test users ready');

    // Create test project
    const project = await createTestProject(
      BASE_URL,
      token,
      'Update & Delete Test Project'
    );
    const projectId = project.id;
    dataTracker.trackProject(projectId); // Track for cleanup
    printStatus('green', `✅ Test project created: ${projectId}`);

    // Create test task
    const task = await createTestTask(BASE_URL, token, projectId, {
      title: 'Task for update and delete tests',
      description: 'This task will be updated and then deleted in tests',
      priority: 2,
    });
    const taskId = task.id;
    dataTracker.trackTask(taskId); // Track for cleanup
    printStatus('green', `✅ Test task created: ${taskId}`);

    console.log();
    printStatus('blue', '🚀 Running Update Task Test Cases...');
    console.log();

    // Test Case 1: Update Task - Success
    printStatus('yellow', 'Test Case 1: Update Task - Success');
    try {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 3,
        is_completed: true,
      };

      const updateResponse = await axios.put(
        `${BASE_URL}/tasks/${taskId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      testResponse(
        'Update Task - Success',
        200,
        updateResponse.status,
        updateResponse.data
      );

      // Verify task is updated by fetching project tasks
      const verifyResponse = await axios.get(
        `${BASE_URL}/projects/${projectId}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (verifyResponse.status === 200) {
        const updatedTask = verifyResponse.data.tasks.find(
          (t) => t.id === taskId
        );
        if (
          updatedTask &&
          updatedTask.title === 'Updated Task Title' &&
          updatedTask.description === 'Updated description' &&
          updatedTask.priority === 3 &&
          updatedTask.is_completed === true
        ) {
          printStatus(
            'green',
            '✅ Verified: Task successfully updated in database'
          );
        } else {
          printStatus('red', '❌ Task update verification failed');
        }
      }
    } catch (error) {
      testResponse(
        'Update Task - Success',
        200,
        error.response?.status || 'ERROR',
        error.response?.data || error.message
      );
    }
    console.log();

    // Test Case 2: Update Task - Unauthorized (No Token)
    printStatus('yellow', 'Test Case 2: Update Task - Unauthorized (No Token)');
    await testApiEndpoint('Update Task - Unauthorized', 401, async () => {
      return axios.put(`${BASE_URL}/tasks/${taskId}`, {
        title: 'Should fail',
      });
    });
    console.log();

    // Test Case 3: Update Task - Not Owner (Different User)
    printStatus(
      'yellow',
      'Test Case 3: Update Task - Not Owner (Different User)'
    );
    await testApiEndpoint('Update Task - Not Owner', 403, async () => {
      return axios.put(
        `${BASE_URL}/tasks/${taskId}`,
        {
          title: 'Should fail',
        },
        {
          headers: { Authorization: `Bearer ${secondaryUser.token}` },
        }
      );
    });
    console.log();

    // Test Case 4: Update Task - Not Found
    printStatus('yellow', 'Test Case 4: Update Task - Not Found');
    await testApiEndpoint('Update Task - Not Found', 404, async () => {
      return axios.put(
        `${BASE_URL}/tasks/00000000-0000-0000-0000-000000000000`,
        { title: 'Should fail' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    });
    console.log();

    // Test Case 5: Update Task - Invalid Data
    printStatus('yellow', 'Test Case 5: Update Task - Invalid Data');
    await testApiEndpoint('Update Task - Invalid Data', 400, async () => {
      return axios.put(
        `${BASE_URL}/tasks/${taskId}`,
        {
          priority: 5, // Invalid: outside range 1-3
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    });
    console.log();

    printStatus('blue', '🚀 Running Delete Task Test Cases...');
    console.log();

    // Test Case 6: Delete Task - Success
    printStatus('yellow', 'Test Case 6: Delete Task - Success');
    try {
      const deleteResponse = await axios.delete(`${BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      testResponse(
        'Delete Task - Success',
        200,
        deleteResponse.status,
        deleteResponse.data
      );

      // Verify task is deleted by checking project tasks
      const verifyResponse = await axios.get(
        `${BASE_URL}/projects/${projectId}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (verifyResponse.status === 200 && verifyResponse.data.count === 0) {
        printStatus(
          'green',
          '✅ Verified: Task successfully deleted from database'
        );
      } else {
        printStatus('red', '❌ Task deletion verification failed');
      }
    } catch (error) {
      testResponse(
        'Delete Task - Success',
        200,
        error.response?.status || 'ERROR',
        error.response?.data || error.message
      );
    }
    console.log();

    // Test Case 7: Delete Task - Unauthorized (No Token)
    printStatus('yellow', 'Test Case 7: Delete Task - Unauthorized (No Token)');
    try {
      await axios.delete(`${BASE_URL}/tasks/${taskId}`);
      testResponse(
        'Delete Task - Unauthorized',
        401,
        200,
        'Should have failed'
      );
    } catch (error) {
      testResponse(
        'Delete Task - Unauthorized',
        401,
        error.response?.status || 'ERROR',
        error.response?.data || error.message
      );
    }
    console.log();

    // Test Case 8: Delete Task - Not Owner (Different User)
    printStatus(
      'yellow',
      'Test Case 8: Delete Task - Not Owner (Different User)'
    );
    try {
      // Create a new task for the primary user to test with
      const newTask = await createTestTask(BASE_URL, token, projectId, {
        title: 'Task for ownership test',
        description: 'This task will test ownership',
        priority: 1,
      });
      const newTaskId = newTask.id;
      dataTracker.trackTask(newTaskId); // Track for cleanup

      // Try to delete with secondary user's token (different user)
      await testApiEndpoint('Delete Task - Not Owner', 403, async () => {
        return axios.delete(`${BASE_URL}/tasks/${newTaskId}`, {
          headers: { Authorization: `Bearer ${secondaryUser.token}` },
        });
      });
    } catch (error) {
      printStatus('red', `❌ Error in ownership test: ${error.message}`);
    }
    console.log();

    // Test Case 9: Delete Task - Not Found
    printStatus('yellow', 'Test Case 9: Delete Task - Not Found');
    await testApiEndpoint('Delete Task - Not Found', 404, async () => {
      return axios.delete(
        `${BASE_URL}/tasks/00000000-0000-0000-0000-000000000000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    });
    console.log();

    // Additional Test: Invalid UUID Format
    printStatus('yellow', 'Additional Test: Invalid UUID Format');
    await testApiEndpoint('Delete Task - Invalid UUID', 400, async () => {
      return axios.delete(`${BASE_URL}/tasks/invalid-uuid`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    });
    console.log();

    // Summary
    printTestSummary('All Update & Delete Task API test cases completed', [
      'Test Case 1: Update Task - Success (200)',
      'Test Case 2: Update Task - Unauthorized (401)',
      'Test Case 3: Update Task - Not Owner (403)',
      'Test Case 4: Update Task - Not Found (404)',
      'Test Case 5: Update Task - Invalid Data (400)',
      'Test Case 6: Delete Task - Success (200)',
      'Test Case 7: Delete Task - Unauthorized (401)',
      'Test Case 8: Delete Task - Not Owner (403)',
      'Test Case 9: Delete Task - Not Found (404)',
      'Additional: Invalid UUID Format (400)',
    ]);

    // Cleanup test data
    await dataTracker.cleanup(BASE_URL, token);
  } catch (error) {
    printStatus('red', `❌ Test failed: ${error.message}`);
    if (error.response) {
      printStatus('red', `   Status: ${error.response.status}`);
      printStatus('red', `   Response: ${JSON.stringify(error.response.data)}`);
    }

    // Attempt cleanup even if tests failed
    try {
      if (token) {
        await dataTracker.cleanup(BASE_URL, token);
      }
    } catch (cleanupError) {
      printStatus('red', `❌ Cleanup failed: ${cleanupError.message}`);
    }

    throw error;
  }
}

// Run the tests
if (require.main === module) {
  runUpdateDeleteTaskTests();
}

module.exports = { runUpdateDeleteTaskTests };
