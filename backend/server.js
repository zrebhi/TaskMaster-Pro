const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./config/database');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for CORS
// Configure CORS to allow requests from your frontend origin during development
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Replace with frontend URL in production
  credentials: true, // Allow cookies/auth headers
};
app.use(cors(corsOptions));


// Mount authentication routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));


// Only start server if this file is run directly (not when imported for tests)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

module.exports = app; // Export the app for testing
