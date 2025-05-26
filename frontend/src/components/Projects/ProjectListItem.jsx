import React from 'react';

const ProjectListItem = ({ project, onSelectProject, isActive, onEdit }) => {
  return (
    <li
      style={{
        padding: '10px',
        border: '1px solid #ccc',
        marginBottom: '5px',
        backgroundColor: isActive ? '#e0e0e0' : 'transparent',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span onClick={() => onSelectProject(project.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
        {project.name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent li's onClick from firing
          onEdit(project);
        }}
        style={{ marginLeft: '10px' }}
      >
        Edit
      </button>
      {/* Delete button will be added in F-PROJ-04 */}
    </li>
  );
};

export default ProjectListItem;