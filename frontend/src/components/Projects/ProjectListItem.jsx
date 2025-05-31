/**
 * @param {object} props - Component props
 * @param {object} props.project - The project object to display
 * @param {function} props.onSelectProject - Handler for selecting the project
 * @param {boolean} props.isActive - Whether the project is currently active
 * @param {function} props.onEditClick - Handler for clicking the edit button
 * @param {function} props.onDeleteClick - Handler for clicking the delete button
 */
const ProjectListItem = ({
  project,
  onSelectProject,
  isActive,
  onEditClick,
  onDeleteClick,
}) => {
  return (
    <li
      style={{
        padding: "10px",
        border: "1px solid #ccc",
        marginBottom: "5px",
        backgroundColor: isActive ? "#e0e0e0" : "transparent",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => onSelectProject(project.id)}
        style={{ flexGrow: 1, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {project.name}
      </button>
      <div>
        {" "}
        {/* Wrapper for buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(project);
          }}
          style={{ marginLeft: "10px" }}
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(project.id, project.name);
          }} // Pass ID and name for confirmation
          style={{ marginLeft: "5px", color: "red" }}
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default ProjectListItem;
