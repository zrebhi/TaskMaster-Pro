const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { verifyProjectOwnership } = require('../middleware/projectAuthMiddleware');

// Apply general auth middleware to all project routes
router.use(protect);

// --- Project Specific Routes ---
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);

// --- Routes for a specific project by :projectId ---
// Apply verifyProjectOwnership middleware here. It will run after 'protect'.
// The middleware will find the project, verify ownership, and attach `req.project`.
router.put('/:projectId', verifyProjectOwnership, projectController.updateProject);
router.delete('/:projectId', verifyProjectOwnership, projectController.deleteProject);


// --- Task Specific Routes (nested under projects) ---
// POST /api/projects/:projectId/tasks - Create a new task for a specific project
router.post('/:projectId/tasks', verifyProjectOwnership, taskController.createTask);

// GET /api/projects/:projectId/tasks - Get all tasks for a specific project
router.get('/:projectId/tasks', verifyProjectOwnership, taskController.getTasksForProject);

module.exports = router;
