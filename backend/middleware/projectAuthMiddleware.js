const { Project } = require("../models");

exports.verifyProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId; // Assumes 'protect' middleware has run and set req.user

    if (!userId) {
        // Should be caught by 'protect' middleware, but good for robustness
        return res.status(401).json({ message: "Authentication required." });
    }

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required in parameters." });
    }

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.user_id !== userId) {
      return res.status(403).json({
        message: "User not authorized to access or modify this project's resources.",
      });
    }

    // If all checks pass, attach the project to the request object
    // This avoids re-fetching it in the controller if needed
    req.project = project;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Project authorization error:", error);
    res.status(500).json({ message: "Server error during project authorization." });
  }
};
