const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all project routes
router.use(protect);

// POST /api/projects - Create a new project
router.post('/', projectController.createProject);

// GET /api/projects - Get all projects for the authenticated user
router.get('/', projectController.getProjects);

module.exports = router;
