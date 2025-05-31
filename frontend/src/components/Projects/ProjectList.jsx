import ProjectListItem from "./ProjectListItem";

const ProjectList = ({
  projects,
  onSelectProject,
  activeProjectId,
  onDeleteProject,
  onEditProject,
}) => {
  if (!projects || projects.length === 0) {
    return <p>No projects yet. Create one to get started!</p>;
  }

  return (
    <ul>
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          onSelectProject={onSelectProject}
          isActive={project.id === activeProjectId}
          onEditClick={onEditProject}
          onDeleteClick={onDeleteProject}
        />
      ))}
    </ul>
  );
};

export default ProjectList;
