const { Task, Project } = require('../models');

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
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required.' });
    }
    // (Other specific task field validations can remain if not covered by model)

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
  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(' ') });
    }
    return res
      .status(500)
      .json({ message: 'Server error while creating task.' });
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
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({
      message: 'Tasks fetched successfully.',
      count: tasks.length,
      tasks: tasks,
    });
  } catch (error) {
    console.error('Get tasks for project error:', error);
    return res
      .status(500)
      .json({ message: 'Server error while fetching tasks.' });
  }
};

/**
 * @desc    Update a specific task
 * @route   PUT /api/tasks/:taskId
 * @access  Private (Task ownership verified through project ownership)
 */
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { title, description, due_date, priority, is_completed } = req.body;

    // Fetch the task with its associated project for authorization
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'Project' }],
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Authorization check: verify user owns the project that contains this task
    if (!req.user || task.Project.user_id !== req.user.userId) {
      return res.status(403).json({
        message: 'User not authorized to update this task.',
      });
    }

    // Update task attributes conditionally
    if (title !== undefined) {
      // Title is required (allowNull: false), trim if it's a string
      task.title = typeof title === 'string' ? title.trim() : title;
    }
    if (description !== undefined) {
      // Description is optional (allowNull: true), handle null explicitly
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
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(' ') });
    }
    return res
      .status(500)
      .json({ message: 'Server error while updating task.' });
  }
};
