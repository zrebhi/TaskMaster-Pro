import { useContext } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ProjectContext, { ProjectProvider } from "../ProjectContext";
import AuthContext from "../AuthContext";
import toast from "react-hot-toast";
import * as projectApiService from "../../services/projectApiService";

jest.mock("../../services/projectApiService");

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Helper component to consume ProjectContext for testing
const TestProjectConsumer = () => {
  const context = useContext(ProjectContext);

  if (!context) {
    return (
      <div data-testid="project-context-consumer">Context not available</div>
    );
  }

  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
  } = context;

  return (
    <div data-testid="project-context-consumer">
      <span data-testid="projects">{JSON.stringify(projects)}</span>
      <span data-testid="isLoading">{isLoading.toString()}</span>
      <span data-testid="error">{error ? String(error) : "null"}</span>
      <button data-testid="fetch-projects-button" onClick={fetchProjects}>
        Fetch Projects
      </button>
      <button
        data-testid="add-project-button"
        onClick={async () => {
          try {
            await addProject({ name: "New Project Alpha" });
          } catch (e) {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Add Project Alpha
      </button>
      <button
        data-testid="update-project-button"
        onClick={async () => {
          try {
            await updateProject("p1", { name: "Updated Project P1" });
          } catch (e) {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Update Project P1
      </button>
      <button
        data-testid="delete-project-button"
        onClick={async () => {
          try {
            await deleteProject("p1");
          } catch (e) {
            // Error is handled by context and toast, ignore here for button click
          }
        }}
      >
        Delete Project P1
      </button>
    </div>
  );
};

const mockAuthLogout = jest.fn();

describe("ProjectContext", () => {
  let user;

  const initialProjects = [];

  const renderTestComponent = (authContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue}>
        <ProjectProvider>
          <TestProjectConsumer />
        </ProjectProvider>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  test("initial state is correct", () => {
    const authValue = {
      isAuthenticated: false,
      token: null,
      logout: mockAuthLogout,
    };
    renderTestComponent(authValue);

    expect(screen.getByTestId("projects")).toHaveTextContent(
      JSON.stringify(initialProjects)
    );
    expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("null");
  });

  describe("fetchProjects", () => {
    test("clears projects and does not call API if not authenticated", async () => {
      const authValue = {
        isAuthenticated: false,
        token: null,
        logout: mockAuthLogout,
      };
      renderTestComponent(authValue);
      await user.click(screen.getByTestId("fetch-projects-button"));

      expect(projectApiService.getAllProjects).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([])
        );
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
      });
    });

    test("fetches projects successfully when authenticated", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      const mockProjects = [{ id: "p1", name: "Project One" }];
      projectApiService.getAllProjects.mockResolvedValue(mockProjects);

      renderTestComponent(authValue);
      await user.click(screen.getByTestId("fetch-projects-button"));

      expect(projectApiService.getAllProjects).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify(mockProjects)
        );
        expect(screen.getByTestId("error")).toHaveTextContent("null");
      });
    });

    test("sets error on generic fetch failure", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      const errorMessage = "Network Error";
      projectApiService.getAllProjects.mockRejectedValue(
        new Error(errorMessage)
      );

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      renderTestComponent(authValue);
      await user.click(screen.getByTestId("fetch-projects-button"));

      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify(initialProjects)
        );
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });
      consoleErrorSpy.mockRestore();
    });

    test("sets error from err.response.data.message on API error", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      const apiErrorMessage = "API specific error";
      projectApiService.getAllProjects.mockRejectedValue({
        response: { data: { message: apiErrorMessage } },
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      renderTestComponent(authValue);
      await user.click(screen.getByTestId("fetch-projects-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(apiErrorMessage);
      });
      consoleErrorSpy.mockRestore();
    });

    test("sets error and calls auth logout on 401 error during fetch", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      const unauthorizedMessage = "Token expired";
      projectApiService.getAllProjects.mockRejectedValue({
        response: { status: 401, data: { message: unauthorizedMessage } },
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      renderTestComponent(authValue);
      await user.click(screen.getByTestId("fetch-projects-button"));

      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("error")).toHaveTextContent(
          unauthorizedMessage
        );
        expect(mockAuthLogout).toHaveBeenCalledTimes(1);
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("addProject", () => {
    const projectAlphaData = { name: "New Project Alpha" };
    const projectAlphaResponse = { id: "newP1", ...projectAlphaData };
    const projectBetaData = { name: "New Project Beta" };
    const projectBetaResponse = { id: "newP2", ...projectBetaData };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupAddProjectTest = (authValue) => {
      render(
        <AuthContext.Provider value={authValue}>
          <ProjectProvider>
            <TestProjectConsumer />
            <ContextGrabber />
          </ProjectProvider>
        </AuthContext.Provider>
      );
    };

    test("adds a new project successfully via button click", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      projectApiService.createProjectAPI.mockResolvedValue(
        projectAlphaResponse
      );
      setupAddProjectTest(authValue);

      await user.click(screen.getByTestId("add-project-button"));

      await waitFor(() => {
        expect(projectApiService.createProjectAPI).toHaveBeenCalledWith(
          projectAlphaData,
          authValue.token
        );
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([projectAlphaResponse])
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Project created successfully!"
        );
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
      });
    });

    test("prepends multiple projects correctly", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      setupAddProjectTest(authValue);

      projectApiService.createProjectAPI.mockResolvedValueOnce(
        projectAlphaResponse
      );
      await user.click(screen.getByTestId("add-project-button")); // Adds Alpha

      await waitFor(() =>
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([projectAlphaResponse])
        )
      );

      projectApiService.createProjectAPI.mockResolvedValueOnce(
        projectBetaResponse
      );
      // Add Beta directly via context
      await act(async () => {
        await projectContextInstance.addProject(projectBetaData);
      });

      await waitFor(() => {
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([projectBetaResponse, projectAlphaResponse])
        );
        expect(toast.success).toHaveBeenCalledTimes(2);
      });
    });

    test("handles error when adding project", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      const errorMessage = "Failed to create";
      projectApiService.createProjectAPI.mockRejectedValue(
        new Error(errorMessage)
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      setupAddProjectTest(authValue);

      await user.click(screen.getByTestId("add-project-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([])
        ); // Projects list remains empty
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateProject", () => {
    const initialProject = { id: "p1", name: "Initial Project P1" };
    const projectToUpdateData = { name: "Updated Project P1" };
    const updatedProjectResponse = { id: "p1", ...projectToUpdateData };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupUpdateProjectTest = (authValue, initialContextProjects = []) => {
      // Allow pre-seeding context for update tests
      render(
        <AuthContext.Provider value={authValue}>
          <ProjectProvider>
            <TestProjectConsumer />
            <ContextGrabber />
          </ProjectProvider>
        </AuthContext.Provider>
      );
      // Manually set initial projects in context if needed, bypassing API for setup
      if (initialContextProjects.length > 0 && projectContextInstance) {
        act(() => {
          // This direct manipulation is for test setup only.
          // In a real scenario, projects are populated via fetch or add.
          // We need to ensure 'projects' state in ProjectProvider is set.
          // A more robust way would be to mock fetchProjects to set initial state.
          // For now, we'll add them one by one if addProject is simple enough.
          // Given addProject is now async and API-calling, this is tricky.
          // Let's assume tests will add projects first if needed.
        });
      }
    };

    test("updates an existing project successfully via button click", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue);

      // First, add the project to be updated
      projectApiService.createProjectAPI.mockResolvedValueOnce(initialProject);
      await act(async () => {
        // Wrap direct context call in act
        await projectContextInstance.addProject({ name: initialProject.name });
      });
      await waitFor(() =>
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([initialProject])
        )
      );
      toast.success.mockClear(); // Clear toast from addProject

      projectApiService.updateProjectAPI.mockResolvedValue(
        updatedProjectResponse
      );
      await user.click(screen.getByTestId("update-project-button")); // Button updates "p1"

      await waitFor(() => {
        expect(projectApiService.updateProjectAPI).toHaveBeenCalledWith(
          initialProject.id,
          projectToUpdateData,
          authValue.token
        );
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([updatedProjectResponse])
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Project updated successfully!"
        );
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
      });
    });

    test("handles error when updating project", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue);
      projectApiService.createProjectAPI.mockResolvedValueOnce(initialProject);
      await act(async () => {
        // Wrap direct context call in act
        await projectContextInstance.addProject({ name: initialProject.name });
      });
      await waitFor(() =>
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([initialProject])
        )
      );
      toast.success.mockClear();
      toast.error.mockClear();

      const errorMessage = "Failed to update";
      projectApiService.updateProjectAPI.mockRejectedValue(
        new Error(errorMessage)
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Attempt update via button
      await user.click(screen.getByTestId("update-project-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        // Projects list should remain as it was before the failed update
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([initialProject])
        );
      });
      consoleErrorSpy.mockRestore();
    });

    test("does not change list if updating non-existent project (API error)", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      setupUpdateProjectTest(authValue); // Start with empty projects
      const nonExistentId = "pNonExistent";
      const nonExistentUpdateData = { name: "Non Existent" };
      const errorMessage = "Project not found";
      projectApiService.updateProjectAPI.mockRejectedValue(
        new Error(errorMessage)
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Attempt to update a non-existent project directly
      await act(async () => {
        // Wrap direct context call in act
        try {
          await projectContextInstance.updateProject(
            nonExistentId,
            nonExistentUpdateData
          );
        } catch (e) {
          // Expected to throw
          expect(e.message).toBe(errorMessage);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([])
        ); // List remains empty
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("deleteProject", () => {
    const project1ToDelete = { id: "p1", name: "Project One to Delete" };
    const project2ToKeep = { id: "p2", name: "Project Two to Keep" };

    let projectContextInstance;
    const ContextGrabber = () => {
      projectContextInstance = useContext(ProjectContext);
      return null;
    };

    const setupDeleteTest = async (authValue) => {
      render(
        <AuthContext.Provider value={authValue}>
          <ProjectProvider>
            <TestProjectConsumer />
            <ContextGrabber />
          </ProjectProvider>
        </AuthContext.Provider>
      );
      // Pre-populate projects
      projectApiService.createProjectAPI.mockResolvedValueOnce(project2ToKeep);
      await act(async () => {
        // Wrap direct context call in act
        await projectContextInstance.addProject({ name: project2ToKeep.name });
      });
      projectApiService.createProjectAPI.mockResolvedValueOnce(
        project1ToDelete
      );
      await act(async () => {
        // Wrap direct context call in act
        await projectContextInstance.addProject({
          name: project1ToDelete.name,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([project1ToDelete, project2ToKeep]) // p1 added last, so it's first
        );
      });
      toast.success.mockClear(); // Clear toasts from addProject calls
    };

    test("successfully deletes a project via button click", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      projectApiService.deleteProjectAPI.mockResolvedValue(undefined); // delete typically returns no content or a success message object

      await user.click(screen.getByTestId("delete-project-button")); // Deletes "p1"

      await waitFor(() => {
        expect(projectApiService.deleteProjectAPI).toHaveBeenCalledWith(
          project1ToDelete.id // Token is not passed directly
        );
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([project2ToKeep]) // Only p2 remains
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Project deleted successfully!"
        );
        expect(screen.getByTestId("error")).toHaveTextContent("null");
      });
    });

    test("sets error on generic API failure during delete", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const errorMessage = "Network Error on delete";
      projectApiService.deleteProjectAPI.mockRejectedValue(
        new Error(errorMessage)
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await user.click(screen.getByTestId("delete-project-button"));

      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        // Projects list should remain unchanged on error
        expect(screen.getByTestId("projects")).toHaveTextContent(
          JSON.stringify([project1ToDelete, project2ToKeep])
        );
      });
      consoleErrorSpy.mockRestore();
    });

    test("sets error from err.response.data.message on API delete error", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const apiErrorMessage = "API specific delete error";
      projectApiService.deleteProjectAPI.mockRejectedValue({
        response: { data: { message: apiErrorMessage } },
      });
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await user.click(screen.getByTestId("delete-project-button"));

      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("error")).toHaveTextContent(apiErrorMessage);
        expect(toast.error).toHaveBeenCalledWith(apiErrorMessage);
      });
      consoleErrorSpy.mockRestore();
    });

    test("calls auth logout and sets error on 401 error during delete", async () => {
      const authValue = {
        isAuthenticated: true,
        token: "test-token",
        logout: mockAuthLogout,
      };
      await setupDeleteTest(authValue);
      const unauthorizedMessage = "Session expired on delete";
      projectApiService.deleteProjectAPI.mockRejectedValue({
        response: { status: 401, data: { message: unauthorizedMessage } },
      });
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await user.click(screen.getByTestId("delete-project-button"));

      await waitFor(() => {
        expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
        expect(screen.getByTestId("error")).toHaveTextContent(
          unauthorizedMessage
        );
        expect(toast.error).toHaveBeenCalledWith(unauthorizedMessage);
        expect(mockAuthLogout).toHaveBeenCalledTimes(1);
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
