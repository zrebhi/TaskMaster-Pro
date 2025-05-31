const { Project } = require('../models'); // Still needed for createProject and getProjects

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Project name is required.' });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ message: 'Project name is too long.' });
    }

    const newProject = await Project.create({
      name: name.trim(),
      user_id: userId,
    });

    return res.status(201).json({
      message: 'Project created successfully.',
      project: newProject, // Send the full project object
    });
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(' ') });
    }
    return res
      .status(500)
      .json({ message: 'Server error while creating project.' });
  }
};

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error while fetching projects.' });
  }
};

/**
 * @desc    Update an existing project
 * @route   PUT /api/projects/:projectId
 * @access  Private (Project ownership verified by middleware)
 */
exports.updateProject = async (req, res) => {
  try {
    const { name } = req.body;
    // The project to update is available as req.project (from verifyProjectOwnership middleware)
    const project = req.project;

    // Validate input for the name
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Project name is required.' });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ message: 'Project name is too long.' });
    }

    // Update the project name and save changes
    project.name = name.trim();
    await project.save();

    return res.status(200).json({
      message: 'Project updated successfully.',
      project: project, // Send the updated project object
    });
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(' ') });
    }
    return res
      .status(500)
      .json({ message: 'Server error while updating project.' });
  }
};

/**
 * @desc    Delete an existing project (and its tasks via CASCADE)
 * @route   DELETE /api/projects/:projectId
 * @access  Private (Project ownership verified by middleware)
 */
exports.deleteProject = async (req, res) => {
  try {
    // The project to delete is available as req.project (from verifyProjectOwnership middleware)
    const project = req.project;

    // Delete the project
    // ON DELETE CASCADE in the database (for tasks) and for project.user_id (if user is deleted)
    // will handle associated data.
    await project.destroy();

    res
      .status(200)
      .json({ message: 'Project and associated tasks deleted successfully.' });
    // Alternatively, for 204 No Content:
    // res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error while deleting project.' });
  }
};
