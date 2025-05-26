const { sequelize, User } = require("./models");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Global test user and token
global.testUser = null;
global.testUserToken = null;

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "NODE_ENV not set to 'test'. Aborting to prevent data loss."
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Please set it in your .env file for testing."
    );
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Sync database once for all tests
    console.log("Test database synced successfully.");

    // Create a single test user for all test suites
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    global.testUser = await User.create({
      id: uuidv4(),
      username: "globaltestuser",
      email: "globaltestuser@example.com",
      password_hash: hashedPassword,
    });

    // Generate a token for the global test user
    global.testUserToken = jwt.sign(
      { userId: global.testUser.id, email: global.testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Global test user created and token generated.");
  } catch (error) {
    console.error("Failed to initialize global test database setup:", error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up the global test user
  if (global.testUser) {
    await User.destroy({ where: { id: global.testUser.id } });
  }
  // Close the database connection
  await sequelize.close();
  console.log("Global test database teardown complete.");
});
