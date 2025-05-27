const { Project } = require("../models");

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (requires authentication)
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input: project name is required and not too long
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required." });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ message: "Project name is too long." });
    }

    // Get user ID from the authenticated user (populated by 'protect' middleware)
    const userId = req.user.userId;

    // Create the new project in the database
    const newProject = await Project.create({
      name: name.trim(),
      user_id: userId, // Link the project to the authenticated user
    });

    // Respond with the newly created project details
    res.status(201).json({
      message: "Project created successfully.",
      project: {
        id: newProject.id,
        name: newProject.name,
        user_id: newProject.user_id,
        createdAt: newProject.createdAt,
        updatedAt: newProject.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    // Handle specific errors (e.g., Sequelize validation errors)
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Server error while creating project." });
  }
};

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private (requires authentication)
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getProjects = async (req, res) => {
  try {
    // Get user ID from the authenticated user (populated by 'protect' middleware)
    const userId = req.user.userId;
    if (!userId) {
      // This case should ideally be handled by the 'protect' middleware
      return res
        .status(401)
        .json({ message: "Not authorized, user ID missing." });
    }

    // Find all projects belonging to this user, ordered by creation date
    const projects = await Project.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });

    // Respond with the list of projects
    res.status(200).json({
      message: "Projects fetched successfully.",
      count: projects.length,
      projects: projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error while fetching projects." });
  }
};

/**
 * @desc    Update an existing project
 * @route   PUT /api/projects/:projectId
 * @access  Private (requires authentication)
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.updateProject = async (req, res) => {
  try {
    const { name } = req.body;
    const projectId = req.params.projectId;
    const userId = req.user.userId; // From 'protect' middleware

    // Validate input: project name is required and not too long
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required." });
    }
    if (name.trim().length > 255) {
      return res.status(400).json({ message: "Project name is too long." });
    }

    // Find the project by ID
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Authorization Check: Verify the project belongs to the authenticated user
    if (project.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "User not authorized to update this project." }); // Forbidden
    }

    // Update the project name and save changes
    project.name = name.trim();
    await project.save();

    // Respond with the updated project details
    res.status(200).json({
      message: "Project updated successfully.",
      project: {
        id: project.id,
        name: project.name,
        user_id: project.user_id,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt, // This will be updated by project.save()
      },
    });
  } catch (error) {
    console.error("Update project error:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Server error while updating project." });
  }
};

/**
 * @desc    Delete an existing project (and its tasks via CASCADE)
 * @route   DELETE /api/projects/:projectId
 * @access  Private
 * @param   {object} req - Express request object
 * @param   {object} res - Express response object
 * @returns {Promise<void>}
 */
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.userId; // From 'protect' middleware

    // 1. Find the project by ID
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // 2. Authorization Check: Verify the project belongs to the authenticated user
    if (project.user_id !== userId) {
      return res.status(403).json({ message: 'User not authorized to delete this project.' });
    }

    // 3. Delete the project
    // If ON DELETE CASCADE is set up correctly in the DB for tasks.project_id,
    // associated tasks will be deleted automatically by the database.
    await project.destroy();

    // 4. Respond with success
    // HTTP 204 No Content is often used for successful DELETE operations with no body
    // Or HTTP 200 with a success message
    res.status(200).json({ message: 'Project and associated tasks deleted successfully.' });
    // res.status(204).send(); // Alternative for 204 No Content

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error while deleting project.' });
  }
};
