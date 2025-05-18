const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' }); // Load environment variables from backend/.env

const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env]; // Load configuration from config.js

// Ensure required environment variables are set
if (!config.database || !config.username || !config.host || !config.dialect) {
  console.error('FATAL ERROR: Database configuration environment variables are not set.');
  console.error('Please ensure DB_NAME, DB_USER, DB_HOST, and DB_PASSWORD are set in your backend/.env file.');
  process.exit(1);
}


const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port, 
  dialect: config.dialect,
  logging: config.logging,
  dialectOptions: config.dialectOptions, // Include dialect options (like SSL)
  pool: { // Optional: Connection pool settings
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the database connection (optional but recommended)
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Depending on severity, you might want to exit the process here in production
    // process.exit(1);
  }
}

testConnection();

module.exports = sequelize;