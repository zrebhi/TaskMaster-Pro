import { useContext } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AuthContext, { AuthProvider } from "../AuthContext";

// Helper component to consume AuthContext for testing
const TestComponent = () => {
  const auth = useContext(AuthContext);
  return (
    <div data-testid="auth-context-consumer">
      <span data-testid="token">{auth.token}</span>
      <span data-testid="user">
        {auth.user ? JSON.stringify(auth.user) : "null"}
      </span>
      <span data-testid="isAuthenticated">
        {auth.isAuthenticated.toString()}
      </span>
      <button
        data-testid="login-button"
        onClick={() =>
          auth.login("new-token", { id: "1", username: "testuser" })
        }
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  let user;
  const originalSessionStorage = global.sessionStorage;
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  // Helper to set up sessionStorage.getItem mocks
  const primeSessionStorage = (initialValues = {}) => {
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === "token" && initialValues.token !== undefined) {
        return initialValues.token;
      }
      if (key === "user" && initialValues.user !== undefined) {
        return JSON.stringify(initialValues.user); // Expects user as an object
      }
      return null;
    });
  };

  beforeAll(() => {
    // Mock global sessionStorage for all tests in this suite
    Object.defineProperty(global, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sessionStorage content for each test
    sessionStorageMock.getItem.mockReturnValue(null);
    user = userEvent.setup();
  });

  afterAll(() => {
    // Restore original sessionStorage after all tests in this suite
    Object.defineProperty(global, "sessionStorage", {
      value: originalSessionStorage,
      writable: true,
    });
  });

  test("loads initial state from sessionStorage if token and user exist", () => {
    const token = "initial-token";
    const userData = { id: "user-123", username: "storeduser" };
    primeSessionStorage({ token, user: userData });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(sessionStorageMock.getItem).toHaveBeenCalledWith("token");
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith("user");
    expect(screen.getByTestId("token")).toHaveTextContent(token);
    expect(screen.getByTestId("user")).toHaveTextContent(
      JSON.stringify(userData)
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");
  });

  test("login function updates context state and sessionStorage", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId("login-button");
    await act(async () => {
      await user.click(loginButton);
    });

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "token",
      "new-token"
    );
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ id: "1", username: "testuser" })
    );
    expect(screen.getByTestId("token")).toHaveTextContent("new-token");
    expect(screen.getByTestId("user")).toHaveTextContent(
      JSON.stringify({ id: "1", username: "testuser" })
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");
  });

  test("logout function updates all relevant context state (token, user, isAuthenticated)", async () => {
    // Arrange: Set up initial authenticated state
    const token = "full-logout-token";
    const userData = { id: "full-logout-user", username: "full-logout" };
    primeSessionStorage({ token, user: userData });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Verify initial authenticated state
    expect(screen.getByTestId("token")).toHaveTextContent(token);
    expect(screen.getByTestId("user")).toHaveTextContent(
      JSON.stringify(userData)
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");

    const logoutButton = screen.getByTestId("logout-button");
    await act(async () => {
      await user.click(logoutButton);
    });

    // Assert: Verify all relevant context state is updated
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(screen.getByTestId("user")).toHaveTextContent("null");
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    // Also ensure sessionStorage items were called to be removed
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("token");
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("user");
  });
});
