const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const configFromFile = require('./config')[env];

// Validate that configFromFile was loaded and contains necessary properties
if (
  !configFromFile ||
  !configFromFile.database ||
  !configFromFile.username ||
  !configFromFile.host ||
  !configFromFile.dialect
) {
  console.error(
    `FATAL ERROR: Database configuration is missing or incomplete for environment: '${env}'.`,
  );
  console.error(
    'Please ensure your ./config/config.js file is correctly set up and references necessary environment variables (like DB_NAME, DB_USER, DB_PASSWORD, DB_HOST) which should be defined in your .env file (loaded at application startup).',
  );
  // Log specific missing parts for easier debugging
  if (!configFromFile) {
    console.error(
      `- No configuration found for environment: '${env}' in ./config/config.js`,
    );
  } else {
    if (!configFromFile.database) {console.error('- config.database is missing');}
    if (!configFromFile.username) {console.error('- config.username is missing');}
    // Do not log password value or presence directly for security. Check it internally if needed.
    if (!configFromFile.host) {console.error('- config.host is missing');}
    if (!configFromFile.dialect) {console.error('- config.dialect is missing');}
  }
  process.exit(1); // Critical error, cannot proceed
}

const sequelize = new Sequelize(
  configFromFile.database,
  configFromFile.username,
  configFromFile.password, // Password can be undefined if not set in .env for some DBs (e.g. local SQLite)
  {
    host: configFromFile.host,
    port: configFromFile.port, // Optional, Sequelize uses default if not provided
    dialect: configFromFile.dialect,
    // More robust logging: handle boolean true, a custom function, or false/undefined
    logging:
      configFromFile.logging === true
        ? console.warn
        : typeof configFromFile.logging === 'function'
          ? configFromFile.logging
          : false,
    dialectOptions: configFromFile.dialectOptions || {}, // Ensure dialectOptions is an object even if not in config
    pool: {
      max: configFromFile.pool?.max || 5,
      min: configFromFile.pool?.min || 0,
      acquire: configFromFile.pool?.acquire || 30000,
      idle: configFromFile.pool?.idle || 10000,
    },
  },
);

module.exports = sequelize;
