const { Task, Project } = require('../models');
const { asyncHandler, NotFoundError, AuthorizationError, ValidationError } = require('../utils/customErrors');

exports.verifyTaskOwnership = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user?.userId;

  // Pre-condition checks for required parameters to ensure middleware is used correctly.
  if (!taskId) {
    // This catches route configuration errors where the middleware is applied
    // to a route without a :taskId parameter.
    throw new ValidationError('Task ID is required for this operation.');
  }

  if (!userId) {
    // This catches route configuration errors where the 'protect' middleware
    // was not applied before this one.
    throw new AuthorizationError('User authentication required.');
  }

  // 1. Fetch the task with its associated project for authorization
  const task = await Task.findByPk(taskId, {
    include: [{ model: Project, as: 'Project', attributes: ['user_id'] }],
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  // 2. Authorization check: verify user owns the project that contains this task
  if (task.Project.user_id !== userId) {
    throw new AuthorizationError('User not authorized to access this task.');
  }

  // 3. Attach the verified task to the request object for the next handler
  req.task = task;
  next();
});