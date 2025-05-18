// backend/config/config.js
require("dotenv").config(); // Load environment variables from .env

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === "true",
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== "false",
      },
    },
    logging: process.env.SEQUELIZE_LOGGING === "true" ? console.log : false,
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === "true",
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== "false",
      },
    },
    logging: false, // Typically disable logging in tests
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === "true", // Often required in production
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== "false", // Adjust based on provider
      },
    },
    logging: false, // Typically disable logging in production
  },
};
