const { Task, Project } = require('../models');
const { asyncHandler, NotFoundError, AuthorizationError } = require('../utils/customErrors');

exports.verifyTaskOwnership = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const userId = req.user?.userId;

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