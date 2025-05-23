const { Project } = require("../models");

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (due to 'protect' middleware in routes)
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;

    // 1. Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required." });
    }
    if (name.trim().length > 255) {
      // Check trimmed length
      return res.status(400).json({ message: "Project name is too long." });
    }

    // Additional validation for security
    const trimmedName = name.trim();
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmedName)) {
      return res
        .status(400)
        .json({ message: "Project name contains invalid characters." });
    }
    // 2. Get user ID from the authenticated user (populated by 'protect' middleware)
    const userId = req.user.userId;

    // 3. Create the new project in the database
    const newProject = await Project.create({
      name: name.trim(),
      user_id: userId, // Link the project to the authenticated user
    });

    // 4. Respond with the newly created project
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
