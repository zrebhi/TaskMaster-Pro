import React, { useContext } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoginForm from "../LoginForm";
import AuthContext from "../../../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

// Mock axios
jest.mock("axios");

// Mock react-router-dom's useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("LoginForm", () => {
  let user;
  let identifierInput;
  let passwordInput;
  let submitButton;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    // Mock console.error to prevent test output
    jest.spyOn(console, "error").mockImplementation(() => {});
    user = userEvent.setup();
  });

  // Test Case 1: Component Rendering
  test("renders the login form correctly", () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(identifierInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/login successful/i)).not.toBeInTheDocument();
  });

  // Test Case 2: Input Field Interaction
  test("updates state on input change", async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");

    await user.type(identifierInput, "testuser");
    await user.type(passwordInput, "password123");

    expect(identifierInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");
  });

  // Test Case 3: Form Submission - Successful Login (Username)
  test("calls API with username and navigates on successful login", async () => {
    const successResponse = {
      data: {
        message: "Login successful.",
        token: "fake-token",
        user: { id: "123", username: "testuser", email: "test@example.com" },
      },
      status: 200,
    };
    axios.post.mockResolvedValue(successResponse);

    const mockLogin = jest.fn();
    render(
      <AuthContext.Provider value={{ login: mockLogin, token: null, user: null, isAuthenticated: false, logout: jest.fn() }}>
        <LoginForm />
      </AuthContext.Provider>
    );
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    await user.type(identifierInput, "testuser");
    await user.type(passwordInput, "password123");

    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/auth/login", {
        username: "testuser",
        password: "password123",
      });
      expect(sessionStorage.getItem("token")).toBe("fake-token");
      expect(sessionStorage.getItem("user")).toBe(
        JSON.stringify({
          id: "123",
          username: "testuser",
          email: "test@example.com",
        })
      );
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith("fake-token", {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      });
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
      expect(submitButton).not.toBeDisabled(); // Ensure button is re-enabled
    });
  });

  // Test Case 4: Form Submission - Successful Login (Email)
  test("calls API with email and navigates on successful login", async () => {
    const successResponse = {
      data: {
        message: "Login successful.",
        token: "fake-token-email",
        user: { id: "456", username: "emailuser", email: "email@example.com" },
      },
      status: 200,
    };
    axios.post.mockResolvedValue(successResponse);

    const mockLogin = jest.fn();
     render(
      <AuthContext.Provider value={{ login: mockLogin, token: null, user: null, isAuthenticated: false, logout: jest.fn() }}>
        <LoginForm />
      </AuthContext.Provider>
    );
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    await user.type(identifierInput, "email@example.com");
    await user.type(passwordInput, "password456");

    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/auth/login", {
        email: "email@example.com",
        password: "password456",
      });
      expect(sessionStorage.getItem("token")).toBe("fake-token-email");
      expect(sessionStorage.getItem("user")).toBe(
        JSON.stringify({
          id: "456",
          username: "emailuser",
          email: "email@example.com",
        })
      );
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith("fake-token-email", {
        id: "456",
        username: "emailuser",
        email: "email@example.com",
      });
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard");
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
      expect(submitButton).not.toBeDisabled(); // Ensure button is re-enabled
    });
  });

  // Test Case 5: Form Submission - Failed Login (API Error)
  test("displays error message on failed login (API error)", async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    const errorResponse = {
      response: {
        data: { message: "Invalid credentials." },
        status: 401,
      },
    };
    axios.post.mockRejectedValue(errorResponse);

    await user.type(identifierInput, "wronguser");
    await user.type(passwordInput, "wrongpassword");

    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/invalid credentials./i)).toBeInTheDocument();
      expect(mockedNavigate).not.toHaveBeenCalled(); // Navigation should not happen
      expect(toast.success).not.toHaveBeenCalled(); // Success toast should not happen
      expect(submitButton).not.toBeDisabled(); // Ensure button is re-enabled
    });
  });

  // Test Case 6: Form Submission - Network Error
  test("displays generic error message on network error", async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    axios.post.mockRejectedValue(new Error("Network error, server down"));

    await user.type(identifierInput, "testuser");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Network error, server down")
      ).toBeInTheDocument();
      expect(mockedNavigate).not.toHaveBeenCalled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Test Case 7: Loading State
  test("disables submit button while loading", async () => {
    render(<LoginForm />);
    identifierInput = screen.getByLabelText("Email or Username:");
    passwordInput = screen.getByLabelText("Password:");
    submitButton = screen.getByRole("button", { name: "Login" });

    // Mock axios.post to return a promise that never resolves to simulate loading
    axios.post.mockImplementation(() => new Promise(() => {}));

    await user.type(identifierInput, "testuser");
    await user.type(passwordInput, "password123");

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  afterEach(() => {
    // Restore console.error mock after each test
    jest.restoreAllMocks();
  });
});
