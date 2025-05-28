import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditProjectModal from "../EditProjectModal";
import AuthContext from "../../../context/AuthContext";
import ProjectContext from "../../../context/ProjectContext";

// Mock ProjectContext
const mockUpdateProject = jest.fn();
const mockProjectContextValue = {
  updateProject: mockUpdateProject,
  isLoading: false,
  error: null,
};

const mockAuthContextValue = {
  token: "test-token-123",
  logout: jest.fn(),
  isAuthenticated: true,
};

const renderWithContext = (ui, { authProviderProps, projectProviderProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthContextValue, ...authProviderProps }}>
      <ProjectContext.Provider value={{ ...mockProjectContextValue, ...projectProviderProps }}>
        {ui}
      </ProjectContext.Provider>
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
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    await user.clear(input);
    // To test the JavaScript validation, we submit the form directly,
    // bypassing the browser's own 'required' attribute check on the input.
    const form = screen.getByRole("textbox").closest("form");
    fireEvent.submit(form);

    expect(
      screen.getByText("Project name cannot be empty.")
    ).toBeInTheDocument();
    expect(mockUpdateProject).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("calls updateProject from ProjectContext and calls onClose on successful update", async () => {
    mockUpdateProject.mockResolvedValueOnce({ id: "proj1", name: "Updated Name" }); // Mock successful update

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      {}
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Updated Name");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        mockProject.id,
        { name: "Updated Name" }
      );
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error message from ProjectContext on update error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const errorMessage = "Failed to update project. Please try again."; // Expected error message from ProjectContext
    mockUpdateProject.mockRejectedValueOnce(new Error("Any error")); // Mock failed update

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { projectProviderProps: { error: errorMessage } } // Provide error via context mock
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Problematic Update");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
    console.error.mockRestore();
  });

  it("handles 401 error by calling logout (handled by ProjectContext)", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const errorMessage = "Failed to update project. Please try again."; // Expected error message from ProjectContext after 401
    // Simulate ProjectContext handling 401 and setting a generic error message
    mockUpdateProject.mockRejectedValueOnce({ response: { status: 401, data: { message: "Unauthorized" } } });

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      {
        authProviderProps: { logout: mockAuthContextValue.logout },
        projectProviderProps: { error: errorMessage }
      }
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(input);
    await user.type(input, "Unauthorized Update");
    await user.click(saveButton);

    // Expect the generic error message from ProjectContext to be displayed
    await waitFor(() => {
       expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
    // We don't assert mockAuthContextValue.logout here as it's called by ProjectContext,
    // which is mocked. The test for 401 handling is in ProjectContext.test.jsx.
    console.error.mockRestore();
  });

  it('disables form and shows "Saving..." on save button during loading', async () => {
    // Simulate isLoading state from ProjectContext
    mockUpdateProject.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ id: "proj1", name: "Slow Update" }), 100))
    );

    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      { projectProviderProps: { isLoading: true } } // Provide isLoading via context mock
    );
    const input = screen.getByLabelText(/project name:/i);
    const saveButton = screen.getByRole("button", { name: /saving.../i }); // Button text changes when loading
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    // No need to type and click, just check initial state when isLoading is true
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(input).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /saving.../i })
    ).toBeInTheDocument();

    // Wait for the mock updateProject to potentially finish, though the test
    // is primarily checking the UI state when isLoading is true.
    // We don't need to await the button click or form submission here.
  });

  it("calls onClose when the Cancel button is clicked", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      {}
    );
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it("calls onClose when the overlay is clicked", async () => {
    renderWithContext(
      <EditProjectModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
      />,
      {}
    );
    // The overlay is the first div child of the fragment
    const overlay = screen
      .getByRole("heading", { name: /edit project/i })
      .closest("div").previousSibling;
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });
});
