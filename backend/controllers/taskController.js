const { Task } = require('../models');
const { asyncHandler, ValidationError } = require('../utils/customErrors');

/**
 * @desc    Create a new task within a specific project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private (Project ownership verified by middleware)
 */
exports.createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, due_date, priority } = req.body;

  // Input validation for task fields
  if (!title || title.trim() === '') {
    throw new ValidationError('Task title is required.');
  }

  const newTask = await Task.create({
    project_id: projectId,
    title: title.trim(),
    description: description ? description.trim() : null,
    due_date: due_date || null,
    priority: priority || 2,
  });

  return res.status(201).json({
    message: 'Task created successfully.',
    task: newTask,
  });
});

/**
 * @desc    Get all tasks for a specific project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private (Project ownership verified by middleware)
 */
exports.getTasksForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await Task.findAll({
    where: { project_id: projectId },
    order: [['createdAt', 'ASC']],
  });

  return res.status(200).json({
    message: 'Tasks fetched successfully.',
    count: tasks.length,
    tasks: tasks,
  });
});

/**
 * @desc    Update a specific task (handles both PUT and PATCH)
 * @route   PUT /api/tasks/:taskId
 * @route   PATCH /api/tasks/:taskId
 * @access  Private (Ownership verified by middleware)
 */
exports.updateTask = asyncHandler(async (req, res) => {
  // req.task is provided by the verifyTaskOwnership middleware
  const task = req.task;

  const allowedFields = [
    'title',
    'description',
    'due_date',
    'priority',
    'is_completed',
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updateData[field] = req.body[field];
    }
  });

  // If no valid fields were provided in the request body, it's a bad request.
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError(
      'Request body must contain at least one valid field to update.'
    );
  }

  // The update method efficiently handles both full and partial updates.
  // It only updates fields that are present in the sanitized updateData object.
  await task.update(updateData);

  return res.status(200).json({
    message: 'Task updated successfully.',
    task: task,
  });
});

/**
 * @desc    Delete a specific task
 * @route   DELETE /api/tasks/:taskId
 * @access  Private (Ownership verified by middleware)
 */
exports.deleteTask = asyncHandler(async (req, res) => {
  // req.task is provided by the verifyTaskOwnership middleware
  const task = req.task;

  // Delete the task
  await task.destroy();

  return res.status(200).json({
    message: 'Task deleted successfully.',
  });
});
