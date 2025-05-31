const { Task } = require("../models"); // Project model is no longer needed here directly for these ops

/**
 * @desc    Create a new task within a specific project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private (Project ownership verified by middleware)
 */
exports.createTask = async (req, res) => {
  try {
    // projectId is validated and project ownership is confirmed by verifyProjectOwnership middleware
    // req.project is available if needed, but projectId from params is sufficient here.
    const { projectId } = req.params;
    const { title, description, due_date, priority } = req.body;

    // Input validation for task fields (Sequelize model validations will also run)
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Task title is required." });
    }
    // (Other specific task field validations can remain if not covered by model)

    const newTask = await Task.create({
      project_id: projectId,
      title: title.trim(),
      description: description ? description.trim() : null,
      due_date: due_date || null,
      priority: priority || 2,
    });

    res.status(201).json({
      message: "Task created successfully.",
      task: newTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Server error while creating task." });
  }
};

/**
 * @desc    Get all tasks for a specific project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private (Project ownership verified by middleware)
 */
exports.getTasksForProject = async (req, res) => {
  try {
    // projectId is validated and project ownership is confirmed by verifyProjectOwnership middleware
    const { projectId } = req.params;

    const tasks = await Task.findAll({
      where: { project_id: projectId },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      message: "Tasks fetched successfully.",
      count: tasks.length,
      tasks: tasks,
    });
  } catch (error) {
    console.error("Get tasks for project error:", error);
    res.status(500).json({ message: "Server error while fetching tasks." });
  }
};
