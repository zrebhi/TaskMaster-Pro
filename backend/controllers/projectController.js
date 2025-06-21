const { Project } = require('../models');
const { PROJECT_NAME_MAX_LENGTH } = require('../config/constants');
const {
  asyncHandler,
  ValidationError,
} = require('../utils/customErrors');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name || name.trim() === '') {
    throw new ValidationError('Project name is required.');
  }
  if (name.trim().length > PROJECT_NAME_MAX_LENGTH) {
    throw new ValidationError(`Project name is too long. Maximum length is ${PROJECT_NAME_MAX_LENGTH} characters.`);
  }

  const newProject = await Project.create({
    name: name.trim(),
    user_id: userId,
  });

  return res.status(201).json({
    message: 'Project created successfully.',
    project: newProject,
  });
});

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const projects = await Project.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    message: 'Projects fetched successfully.',
    count: projects.length,
    projects: projects,
  });
});

/**
 * @desc    Update an existing project
 * @route   PUT /api/projects/:projectId
 * @access  Private (Project ownership verified by middleware)
 */
exports.updateProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const project = req.project;

  // Validate input for the name
  if (!name || name.trim() === '') {
    throw new ValidationError('Project name is required.');
  }
  if (name.trim().length > PROJECT_NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Project name is too long. Maximum length is ${PROJECT_NAME_MAX_LENGTH} characters.`
    );
  }

  // Update the project name and save changes
  project.name = name.trim();
  await project.save();

  return res.status(200).json({
    message: 'Project updated successfully.',
    project: project,
  });
});

/**
 * @desc    Delete an existing project (and its tasks via CASCADE)
 * @route   DELETE /api/projects/:projectId
 * @access  Private (Project ownership verified by middleware)
 */
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;

  await project.destroy();

  res
    .status(200)
    .json({ message: 'Project and associated tasks deleted successfully.' });
});
