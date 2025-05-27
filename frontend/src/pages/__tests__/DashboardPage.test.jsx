import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DashboardPage from "../DashboardPage";
import ProjectContext from "../../context/ProjectContext";
import AuthContext from "../../context/AuthContext";
import toast from "react-hot-toast";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock child components to simplify testing DashboardPage logic
jest.mock("../../components/Projects/AddProjectForm", () => ({
  __esModule: true,
  default: ({ onProjectAdded }) => (
    <div>
      AddProjectForm Mock
      <button
        onClick={() =>
          onProjectAdded({ id: "new-project-id", name: "New Project" })
        }
      >
        Mock Add Project
      </button>
    </div>
  ),
}));
jest.mock("../../components/Projects/ProjectList", () => ({
  __esModule: true,
  default: ({
    projects,
    onSelectProject,
    activeProjectId,
    onEditProject,
    onDeleteProject,
  }) => (
    <div>
      ProjectList Mock
      {projects.map((project) => (
        <div key={project.id} data-testid={`project-item-${project.id}`}>
          {project.name}
          <button onClick={() => onSelectProject(project.id)}>Select</button>
          <button onClick={() => onEditProject(project)}>Edit</button>
          <button onClick={() => onDeleteProject(project.id, project.name)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  ),
}));
jest.mock("../../components/Projects/EditProjectModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose, project, onProjectUpdated }) =>
    isOpen ? <div>EditProjectModal Mock</div> : null,
}));
jest.mock("../../components/Projects/DeleteProjectModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm, title, message, isLoading }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm} disabled={isLoading}>
          Confirm
        </button>
        <button onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
      </div>
    ) : null,
}));

describe("DashboardPage - Delete Project Logic", () => {
  const mockProjects = [
    { id: "project-1-id", name: "Project One", user_id: "user-id" },
    { id: "project-2-id", name: "Project Two", user_id: "user-id" },
  ];

  const mockProjectContext = {
    projects: mockProjects,
    fetchProjects: jest.fn(),
    addProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn().mockResolvedValue(undefined), // Mock deleteProject
    isLoading: false,
    error: null,
  };

  const mockAuthContext = {
    isAuthenticated: true,
    token: "fake-token",
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetchProjects to resolve immediately with mockProjects
    mockProjectContext.fetchProjects.mockResolvedValue(undefined); // Default successful fetch
    // Reset deleteProject mock implementation for each test
    mockProjectContext.deleteProject.mockResolvedValue(undefined); // Default successful delete
  });

  const renderDashboard = (
    projectContextOverrides = {},
    authContextOverrides = {}
  ) => {
    return render(
      <AuthContext.Provider
        value={{ ...mockAuthContext, ...authContextOverrides }}
      >
        <ProjectContext.Provider
          value={{ ...mockProjectContext, ...projectContextOverrides }}
        >
          <DashboardPage />
        </ProjectContext.Provider>
      </AuthContext.Provider>
    );
  };

  it("should open the confirmation modal when delete button is clicked", async () => {
    renderDashboard();

    // Wait for ProjectList mock to render
    await screen.findByText("ProjectList Mock");

    const projectOneItem = screen.getByTestId("project-item-project-1-id");
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const confirmationModal = screen.getByTestId("confirmation-modal");
    expect(confirmationModal).toBeInTheDocument();
    expect(screen.getByText("Delete Project")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete the project "Project One"? This will also delete all associated tasks.'
      )
    ).toBeInTheDocument();
  });

  it("should close the confirmation modal when Cancel button is clicked", async () => {
    renderDashboard();

    await screen.findByText("ProjectList Mock");
    const projectOneItem = screen.getByTestId("project-item-project-1-id");
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const cancelButton = screen.getByText("Cancel", { selector: "button" });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });
  });

  it("should call deleteProject from ProjectContext on confirm", async () => {
    renderDashboard();

    await screen.findByText("ProjectList Mock");
    const projectOneItem = screen.getByTestId("project-item-project-1-id");
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText("Confirm", { selector: "button" });
    await userEvent.click(confirmButton);

    // Expect deleteProject from ProjectContext to have been called with the correct project ID
    expect(mockProjectContext.deleteProject).toHaveBeenCalledTimes(1);
    expect(mockProjectContext.deleteProject).toHaveBeenCalledWith(
      "project-1-id"
    );

    // Expect the modal to be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });
  });

  it("should show a success toast message on successful deletion", async () => {
    renderDashboard();

    await screen.findByText("ProjectList Mock");
    const projectOneItem = screen.getByTestId("project-item-project-1-id");
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText("Confirm", { selector: "button" });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Project "Project One" deleted successfully!'
      );
    });
    expect(mockProjectContext.deleteProject).toHaveBeenCalledWith(
      "project-1-id"
    );
  });

  it("should clear activeProjectId if the deleted project was active", async () => {
    renderDashboard();

    await screen.findByText("ProjectList Mock");
    const projectOneItem = screen.getByTestId("project-item-project-1-id");

    // Simulate selecting the project first
    const selectButton = within(projectOneItem).getByText("Select", {
      selector: "button",
    });
    await userEvent.click(selectButton);

    // Now click the delete button for the active project
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText("Confirm", { selector: "button" });
    await userEvent.click(confirmButton);

    // Expect the "Select a project..." message to appear, indicating activeProjectId was cleared
    await waitFor(() => {
      expect(
        screen.getByText("Select a project to view its tasks.")
      ).toBeInTheDocument();
    });
  });

  it("should handle error during deletion by showing a toast error message", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console expected errors for this test
    const mockError = new Error("Context deletion failed");

    // Update the mock context for this specific test to simulate a failed deletion
    const failingDeleteContext = {
      ...mockProjectContext,
      deleteProject: jest.fn().mockRejectedValue(mockError),
    };

    renderDashboard(failingDeleteContext);

    await screen.findByText("ProjectList Mock");
    const projectOneItem = screen.getByTestId("project-item-project-1-id");
    const deleteButton = within(projectOneItem).getByText("Delete", {
      selector: "button",
    });
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText("Confirm", { selector: "button" });
    await userEvent.click(confirmButton);

    // Expect deleteProject from ProjectContext to have been called
    expect(failingDeleteContext.deleteProject).toHaveBeenCalledTimes(1);
    expect(failingDeleteContext.deleteProject).toHaveBeenCalledWith(
      "project-1-id"
    );

    // Expect a toast error to be shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        `Failed to delete project: ${mockError.message}`
      );
    });

    // Expect the modal to be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });
    jest.restoreAllMocks(); // Restore console.error
  });
});
