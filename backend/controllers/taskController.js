const { Task, Project } = require('../models');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require('../utils/customErrors');

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
 * @desc    Update a specific task
 * @route   PUT /api/tasks/:taskId
 * @access  Private (Task ownership verified through project ownership)
 */
exports.updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, due_date, priority, is_completed } = req.body;

  // Fetch the task with its associated project for authorization
  const task = await Task.findByPk(taskId, {
    include: [{ model: Project, as: 'Project' }],
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  // Authorization check: verify user owns the project that contains this task
  if (!req.user || task.Project.user_id !== req.user.userId) {
    throw new AuthorizationError('User not authorized to update this task.');
  }

  // Update task attributes conditionally
  if (title !== undefined) {
    task.title = typeof title === 'string' ? title.trim() : title;
  }
  if (description !== undefined) {
    task.description = description === null ? null : description.trim();
  }
  if (due_date !== undefined) task.due_date = due_date;
  if (priority !== undefined) task.priority = priority;
  if (is_completed !== undefined) task.is_completed = is_completed;

  // Save the updated task (triggers Sequelize model validations)
  await task.save();

  return res.status(200).json({
    message: 'Task updated successfully.',
    task: task,
  });
});
