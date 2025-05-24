import React from 'react';

const ProjectListItem = ({ project, onSelectProject, isActive, onDelete, onEdit }) => {
  return (
    <li
      style={{
        padding: "10px",
        border: "1px solid #ccc",
        marginBottom: "5px",
        cursor: "pointer",
        backgroundColor: isActive ? "#e0e0e0" : "transparent", // Highlight active project
      }}
      onClick={() => onSelectProject(project.id)} // Function passed from parent to handle project selection
    >
      {project.name}
    </li>
  );
};

export default ProjectListItem;