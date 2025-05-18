const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./config/database'); // Import the database configuration

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


// Basic route for testing
app.get('/', (req, res) => {
  res.send('TaskMaster Pro Backend is running!');
});

// Example of a simple API route (will be replaced by actual auth/project/task routes)
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend API!' });
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});