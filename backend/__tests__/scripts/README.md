# API Test Scripts

This directory contains test scripts for manually testing API endpoints with real HTTP requests.

## Delete Task API Test Script

### Files

- `task.delete.api.test.js` - JavaScript test script using axios
- `testScriptHelpers.js` - Centralized helper functions for test scripts

### Purpose

Tests the DELETE `/api/tasks/:taskId` endpoint with comprehensive test cases covering:

1. **Success Case** (200) - Successfully delete a task
2. **Unauthorized** (401) - Delete without authentication token
3. **Not Owner** (403) - Delete task owned by different user
4. **Not Found** (404) - Delete non-existent task
5. **Invalid UUID** (500) - Delete with malformed task ID

### Prerequisites

1. **Server Running**: Backend server must be running on port 3001

   ```bash
   npm start
   ```

2. **Dependencies**: axios must be installed (already included in package.json)

### Helper Functions

The `testScriptHelpers.js` module provides reusable functions for API testing:

- **Server Management**: `checkServer()` - Verify server is running
- **User Management**: `getReusableTestUsers()`, `createTestUser()`, `registerUser()`, `loginUser()`
- **Data Setup**: `createTestProject()`, `createTestTask()`, `setupTestEnvironment()`
- **Testing Utilities**: `testApiEndpoint()`, `testResponse()`, `makeAuthenticatedRequest()`
- **Output Formatting**: `printStatus()`, `printTestSummary()`
- **Cleanup Utilities**: `TestDataTracker`, `cleanupTestData()`, `deleteTask()`, `deleteProject()`

These helpers make test scripts more maintainable and reduce code duplication.

**Reusable Test Users**: The script uses two persistent test users (`testuser_primary` and `testuser_secondary`) that are created once and reused across test runs to avoid database pollution.

**Automatic Cleanup**: The script automatically tracks and cleans up all created test data (tasks and projects) at the end of execution to prevent database pollution.

### Usage

```bash
# From backend directory
node __tests__/scripts/task.delete.api.test.js
```

### Test Flow

1. **Setup Phase**:

   - Gets or creates reusable test users (primary and secondary)
   - Authenticates and gets JWT tokens
   - Creates a test project for the primary user
   - Creates a test task

2. **Test Execution**:

   - Runs all 5 test cases in sequence
   - Validates HTTP status codes
   - Verifies database state changes

3. **Cleanup**:
   - Automatically deletes all created test data (tasks and projects)
   - Cleans up temporary files
   - Reusable test users remain for future test runs

### Expected Output

```
🧪 Starting Delete Task API Tests...

🔍 Checking if server is running...
✅ Server is running

📋 Setting up test data...
✅ Test user created and authenticated
✅ Test project created: [project-id]
✅ Test task created: [task-id]

🚀 Running Test Cases...

Test Case 6: Delete Task - Success
✅ Delete Task - Success (Status: 200)
✅ Verified: Task successfully deleted from database

Test Case 7: Delete Task - Unauthorized (No Token)
✅ Delete Task - Unauthorized (Status: 401)

Test Case 8: Delete Task - Not Owner (Different User)
✅ Delete Task - Not Owner (Status: 403)

Test Case 9: Delete Task - Not Found
✅ Delete Task - Not Found (Status: 404)

Additional Test: Invalid UUID Format
✅ Delete Task - Invalid UUID (Status: 500)

📊 Test Summary
✅ All Delete Task API test cases completed
📋 Test Cases Covered:
   ✅ Test Case 6: Delete Task - Success (200)
   ✅ Test Case 7: Delete Task - Unauthorized (401)
   ✅ Test Case 8: Delete Task - Not Owner (403)
   ✅ Test Case 9: Delete Task - Not Found (404)
   ✅ Additional: Invalid UUID Format (500)

🎉 Delete Task API testing completed successfully!
🧹 Cleaning up test data...
✅ Cleaned up 1 project(s)
✅ Cleaned up 2 individual task(s)
```

### Error Handling

- If server is not running, script will exit with helpful message
- If any test case fails, detailed error information is displayed
- Script uses colored output for easy visual verification

### Integration with Development Workflow

- Run after implementing new API endpoints
- Use for manual verification before committing changes
- Helpful for debugging API issues
- Can be integrated into CI/CD pipeline

### Notes

- Uses two persistent test users that are reused across test runs to minimize database pollution
- Each test run creates new projects/tasks but reuses existing users
- **Automatic cleanup**: All created test data (projects/tasks) is automatically deleted at the end of each test run
- Scripts are safe to run multiple times without accumulating test data
- Uses real database operations (not mocked)
- Cleanup occurs even if tests fail to ensure database cleanliness
