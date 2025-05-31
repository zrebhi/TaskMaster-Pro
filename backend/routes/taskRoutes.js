const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

/* --- Router-level Middleware ---
Apply authentication middleware to all routes defined in this file.
This ensures only authenticated users can access task-specific functionalities. */
router.use(protect);

/* --- Task-specific Routes ---
These routes operate on individual tasks identified by :taskId */

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update a specific task (title, description, due_date, priority, completion status)
 * @access  Private (User must be authenticated and own the project containing the task)
 */
router.put('/:taskId', taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete a specific task
 * @access  Private (User must be authenticated and own the project containing the task)
 */
// router.delete('/:taskId', taskController.deleteTask); // Will be implemented in next sub-feature

module.exports = router;
