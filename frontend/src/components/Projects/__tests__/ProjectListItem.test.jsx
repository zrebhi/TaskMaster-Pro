import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ProjectListItem from "../ProjectListItem";

describe("ProjectListItem", () => {
  const mockProject = {
    id: "1",
    name: "Test Project 1",
  };

  const mockOnSelectProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the project name", () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });

  it("calls onSelectProject with project id when clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    const listItem = screen.getByText(mockProject.name); // Assuming the project name is the clickable area
    await user.click(listItem);
    expect(mockOnSelectProject).toHaveBeenCalledTimes(1);
    expect(mockOnSelectProject).toHaveBeenCalledWith(mockProject.id);
  });

  it("applies active styles when isActive is true", () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={true}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    const listItem = screen.getByText(mockProject.name).closest("li");
    expect(listItem).toHaveStyle("background-color: #e0e0e0");
  });

  it("applies non-active styles when isActive is false", () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    const listItem = screen.getByText(mockProject.name).closest("li");
    expect(listItem).toHaveStyle("background-color: transparent");
  });

  it("renders the Edit button", () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("calls onEdit with the project object when the Edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={mockOnEdit}
        onDeleteClick={jest.fn()}
      />
    );
    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
    expect(mockOnSelectProject).not.toHaveBeenCalled();
  });

  it("renders the Delete button", () => {
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onDeleteClick with project id and name when the Delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();
    render(
      <ProjectListItem
        project={mockProject}
        onSelectProject={mockOnSelectProject}
        isActive={false}
        onEditClick={jest.fn()}
        onDeleteClick={mockOnDelete}
      />
    );
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id, mockProject.name);
    expect(mockOnSelectProject).not.toHaveBeenCalled();
  });
});
