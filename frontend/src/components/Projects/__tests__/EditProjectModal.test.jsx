import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import EditProjectModal from "../EditProjectModal";
import AuthContext from "../../../context/AuthContext";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAuthContextValue = {
  token: "test-token-123",
  logout: jest.fn(),
};

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthContextValue, ...providerProps }}>
      {ui}
    </AuthContext.Provider>,
    renderOptions
  );
};

describe("EditProjectModal", () => {
  const mockProject = {
    id: "proj1",
    name: "Initial Project Name",
  };
  const mockOnClose = jest.fn();
  const mockOnProjectUpdated = jest.fn();
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={false}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit Project")).not.toBeInTheDocument();
  });

  it("does not render when project is null", () => {
    renderWithContext(
      <EditProjectModal
        project={null}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit Project")).not.toBeInTheDocument();
  });

  it("renders correctly when isOpen is true and project is provided", () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    expect(
      screen.getByRole("heading", { name: /edit project/i })
    ).toBeInTheDocument();
    const input = screen.getByLabelText(/project name:/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(mockProject.name);
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("allows typing in the project name input", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    await user.clear(input); // Clear initial value
    await user.type(input, "Updated Project Name");
    expect(input).toHaveValue("Updated Project Name");
  });

  it("shows an error if project name is empty on submit", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    await user.clear(input);
    // To test the JavaScript validation, we submit the form directly,
    // bypassing the browser's own 'required' attribute check on the input.
    const form = screen.getByRole("textbox").closest("form");
    fireEvent.submit(form);

    // The error message should now appear due to our JavaScript validation
    expect(
      screen.getByText("Project name cannot be empty.")
    ).toBeInTheDocument();
    expect(axios.put).not.toHaveBeenCalled();
    expect(mockOnProjectUpdated).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("submits the form, calls onProjectUpdated, and calls onClose on successful update", async () => {
    const updatedProjectData = { id: "proj1", name: "Updated Name" };
    axios.put.mockResolvedValueOnce({
      data: { project: updatedProjectData, message: "Project updated" },
    });

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Updated Name");
    await user.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `/api/projects/${mockProject.id}`,
        { name: "Updated Name" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockAuthContextValue.token}`,
          },
        }
      );
    });
    expect(mockOnProjectUpdated).toHaveBeenCalledWith(updatedProjectData);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled(); // Toast is handled in DashboardPage
  });

  it("shows an error message from the server on API error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.put.mockRejectedValueOnce({
      response: { data: { message: "Server validation failed" }, status: 400 },
    });

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Problematic Update");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Server validation failed")).toBeInTheDocument();
    });
    expect(mockOnProjectUpdated).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("handles 401 error by calling logout", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.put.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Unauthorized" } },
    });

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Unauthorized Update");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("Unauthorized")).toBeInTheDocument(); // Error message should still be shown
    expect(mockOnProjectUpdated).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables form and shows "Saving..." on save button during loading', async () => {
    // Make axios.put take some time to resolve
    axios.put.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { project: { id: "proj1", name: "Slow Update" } },
              }),
            100
          )
        )
    );

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    await user.clear(input);
    await user.type(input, "Slow Update");
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(input).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /saving.../i })
    ).toBeInTheDocument();

    // Wait for the submission to complete to avoid state update errors
    await waitFor(() => expect(mockOnProjectUpdated).toHaveBeenCalledTimes(1));
  });

  it("calls onClose when the Cancel button is clicked", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(axios.put).not.toHaveBeenCalled();
    expect(mockOnProjectUpdated).not.toHaveBeenCalled();
  });

  it("calls onClose when the overlay is clicked", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onProjectUpdated={mockOnProjectUpdated}
      />,
      {}
    );
    // The overlay is the first div child of the fragment
    const overlay = screen
      .getByRole("heading", { name: /edit project/i })
      .closest("div").previousSibling;
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(axios.put).not.toHaveBeenCalled();
    expect(mockOnProjectUpdated).not.toHaveBeenCalled();
  });
});
