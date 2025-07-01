const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
// Import the new middleware
const { verifyTaskOwnership } = require('../middleware/taskAuthMiddleware');

router.use(protect);

// All routes below now operate on a specific task and need ownership verification

/**
 * @route   PUT /api/tasks/:taskId
 * @route   PATCH /api/tasks/:taskId
 * @desc    Update a specific task (full or partial update)
 * @access  Private (User must own the task's project)
 */
router.put('/:taskId', verifyTaskOwnership, taskController.updateTask);
router.patch('/:taskId', verifyTaskOwnership, taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete a specific task
 * @access  Private (User must own the task's project)
 */
router.delete('/:taskId', verifyTaskOwnership, taskController.deleteTask);

module.exports = router;
