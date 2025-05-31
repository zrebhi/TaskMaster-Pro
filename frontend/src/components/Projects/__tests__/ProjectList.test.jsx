import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectList from "../ProjectList";
import ProjectListItem from "../ProjectListItem";

// Mock ProjectListItem to isolate ProjectList logic
jest.mock("../ProjectListItem", () => {
  return jest.fn(
    ({ project, onSelectProject, isActive, onEditClick, onDeleteClick }) => (
      <li
        data-testid={`project-item-${project.id}`}
        style={{ backgroundColor: isActive ? "activebg" : "inactivebg" }}
      >
        <span
          onClick={() => onSelectProject(project.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onSelectProject(project.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {project.name}
        </span>
        <div>
          {onEditClick ? <button onClick={() => onEditClick(project)}>Edit</button> : null}
          {onDeleteClick ? <button onClick={() => onDeleteClick(project.id, project.name)}>
              Delete
            </button> : null}
        </div>
      </li>
    )
  );
});

describe("ProjectList", () => {
  const mockProjects = [
    { id: "1", name: "Project Alpha" },
    { id: "2", name: "Project Beta" },
    { id: "3", name: "Project Gamma" },
  ];
  const mockOnSelectProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "No projects yet" message when projects array is empty', () => {
    render(
      <ProjectList
        projects={[]}
        onSelectProject={mockOnSelectProject}
        activeProjectId={null}
      />
    );
    expect(
      screen.getByText("No projects yet. Create one to get started!")
    ).toBeInTheDocument();
  });

  it('renders "No projects yet" message when projects prop is null', () => {
    render(
      <ProjectList
        projects={null}
        onSelectProject={mockOnSelectProject}
        activeProjectId={null}
      />
    );
    expect(
      screen.getByText("No projects yet. Create one to get started!")
    ).toBeInTheDocument();
  });

  it("renders a list of ProjectListItem components when projects are provided", () => {
    render(
      <ProjectList
        projects={mockProjects}
        onSelectProject={mockOnSelectProject}
        activeProjectId={"2"}
      />
    );

    expect(ProjectListItem).toHaveBeenCalledTimes(mockProjects.length);
    mockProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it("passes correct props to each ProjectListItem", () => {
    const activeId = "2";
    render(
      <ProjectList
        projects={mockProjects}
        onSelectProject={mockOnSelectProject}
        activeProjectId={activeId}
        onEditProject={jest.fn()}
        onDeleteProject={jest.fn()}
      />
    );

    expect(ProjectListItem).toHaveBeenCalledTimes(3);

    // Check props for the first item (Project Alpha, id: '1')
    expect(ProjectListItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        project: mockProjects[0],
        onSelectProject: mockOnSelectProject,
        isActive: false,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );

    // Check props for the second item (Project Beta, id: '2' - active)
    expect(ProjectListItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        project: mockProjects[1],
        onSelectProject: mockOnSelectProject,
        isActive: true,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );

    // Check props for the third item (Project Gamma, id: '3')
    expect(ProjectListItem).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        project: mockProjects[2],
        onSelectProject: mockOnSelectProject,
        isActive: false,
        onEditClick: expect.any(Function),
        onDeleteClick: expect.any(Function),
      }),
      undefined
    );
  });

  it("highlights the active project", () => {
    const activeId = "1";
    render(
      <ProjectList
        projects={mockProjects}
        onSelectProject={mockOnSelectProject}
        activeProjectId={activeId}
      />
    );

    const activeItem = screen.getByTestId(`project-item-${activeId}`);
    const inactiveItem = screen.getByTestId(`project-item-2`); // e.g. project with id '2'

    expect(activeItem).toHaveStyle("background-color: activebg");
    expect(inactiveItem).toHaveStyle("background-color: inactivebg");
  });
});
