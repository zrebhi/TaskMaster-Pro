const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware'); // Authentication middleware
const {
  verifyProjectOwnership,
} = require('../middleware/projectAuthMiddleware'); // Authorization middleware for project access

/* --- Router-level Middleware ---
Apply general authentication middleware (protect) to all routes defined in this file.
This ensures only authenticated users can access project-related functionalities. */
router.use(protect);

/* --- Project CRUD Routes --- */

/**
 * @route   POST /api/projects
 * @desc    Create a new project for the authenticated user
 * @access  Private (User must be authenticated)
 */
router.post('/', projectController.createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user
 * @access  Private (User must be authenticated)
 */
router.get('/', projectController.getProjects);

/* --- Routes for a specific project identified by :projectId ---
These routes operate on a single project and require project ownership verification. */

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update an existing project owned by the authenticated user
 * @access  Private (User must be authenticated and own the project)
 * @middleware verifyProjectOwnership - Ensures the user owns the project before allowing modification.
 *             Attaches the project to `req.project`.
 */
router.put(
  '/:projectId',
  verifyProjectOwnership,
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete a project owned by the authenticated user
 * @access  Private (User must be authenticated and own the project)
 * @middleware verifyProjectOwnership - Ensures the user owns the project before allowing deletion.
 *             Attaches the project to `req.project`.
 */
router.delete(
  '/:projectId',
  verifyProjectOwnership,
  projectController.deleteProject
);

/* --- Task Specific Routes (nested under projects) ---
These routes manage tasks associated with a specific project. */

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create a new task for a specific project
 * @access  Private (User must be authenticated and own the project)
 * @middleware verifyProjectOwnership - Ensures the user owns the parent project.
 */
router.post(
  '/:projectId/tasks',
  verifyProjectOwnership,
  taskController.createTask
);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get all tasks for a specific project
 * @access  Private (User must be authenticated and own the project)
 * @middleware verifyProjectOwnership - Ensures the user owns the parent project.
 */
router.get(
  '/:projectId/tasks',
  verifyProjectOwnership,
  taskController.getTasksForProject
);

module.exports = router;
