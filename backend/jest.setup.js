const databaseTestHelper = require('./__tests__/helpers/database');

// Global setup and teardown
beforeAll(async () => {
  // Validate environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      "NODE_ENV not set to 'test'. Aborting to prevent data loss."
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Please set it in your .env file for testing.'
    );
  }

  try {
    // Initialize database once for all tests
    await databaseTestHelper.initialize();
  } catch (error) {
    console.error('Failed to initialize global test database setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up and close database connection
    await databaseTestHelper.close();
  } catch (error) {
    console.error('Error during global test teardown:', error);
  }
});
