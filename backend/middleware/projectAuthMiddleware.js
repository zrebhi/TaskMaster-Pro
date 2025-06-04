const { Project } = require('../models');
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require('../utils/customErrors');

exports.verifyProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AuthenticationError('Authentication required.');
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required in parameters.');
    }

    const project = await Project.findByPk(projectId);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user_id !== userId) {
      throw new AuthorizationError(
        "User not authorized to access or modify this project's resources."
      );
    }

    // If all checks pass, attach the project to the request object
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};
