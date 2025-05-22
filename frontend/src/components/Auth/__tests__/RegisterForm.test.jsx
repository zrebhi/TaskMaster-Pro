import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../RegisterForm";
import { toast } from "react-hot-toast";

jest.mock("axios");

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Helper function to fill and submit the form
const fillAndSubmitForm = async (
  user,
  { username, email, password, confirmPassword },
  {
    usernameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    submitButton,
  }
) => {
  if (username !== undefined) await user.type(usernameInput, username);
  if (email !== undefined) await user.type(emailInput, email);
  if (password !== undefined) await user.type(passwordInput, password);
  if (confirmPassword !== undefined)
    await user.type(confirmPasswordInput, confirmPassword);
  await user.click(submitButton);
};

describe("RegisterForm", () => {
  let user;
  let usernameInput;
  let emailInput;
  let passwordInput;
  let confirmPasswordInput;
  let submitButton;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to prevent test output
    jest.spyOn(console, "error").mockImplementation(() => {});

    render(<RegisterForm />);
    user = userEvent.setup();

    usernameInput = screen.getByLabelText("Username:");
    emailInput = screen.getByLabelText("Email:");
    passwordInput = screen.getByLabelText("Password:");
    confirmPasswordInput = screen.getByLabelText("Confirm Password:");
    submitButton = screen.getByRole("button", { name: /register/i });
  });

  // Test Case 1: Component Rendering
  test("renders the registration form correctly", () => {
    expect(
      screen.getByRole("heading", { name: /register/i })
    ).toBeInTheDocument();
    expect(usernameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(
      screen.queryByText(/passwords do not match/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/registration successful/i)
    ).not.toBeInTheDocument();
  });

  // Test Case 2: Input Field Interaction
  test("updates state on input change", async () => {
    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");

    expect(usernameInput).toHaveValue("testuser");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(confirmPasswordInput).toHaveValue("password123");
  });

  // Test Case 3: Client-Side Validation - Mismatched Passwords
  test("displays error if passwords do not match on submission", async () => {
    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password456", // Mismatched password
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled(); // API call should not happen
    expect(mockedNavigate).not.toHaveBeenCalled(); // Navigation should not happen
    expect(toast.success).not.toHaveBeenCalled(); // Success toast should not happen
  });

  // Test Case 4: Client-Side Validation - Password too short
  test("displays error if password is less than 6 characters on submission", async () => {
    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "short", // Password too short
        confirmPassword: "short",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    expect(
      screen.getByText(/password must be at least 6 characters long/i)
    ).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled(); // API call should not happen
    expect(mockedNavigate).not.toHaveBeenCalled(); // Navigation should not happen
    expect(toast.success).not.toHaveBeenCalled(); // Success toast should not happen
  });

  // Test Case 5: Client-Side Validation - Invalid Username Characters
  test("displays error if username contains invalid characters on submission", async () => {
    await fillAndSubmitForm(
      user,
      {
        username: "test user!", // Invalid characters
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    expect(
      screen.getByText(
        /username can only contain letters, numbers, underscores, and hyphens/i
      )
    ).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled(); // API call should not happen
    expect(mockedNavigate).not.toHaveBeenCalled(); // Navigation should not happen
    expect(toast.success).not.toHaveBeenCalled(); // Success toast should not happen
  });
  // Test Case 6: Form Submission - Successful Registration
  test("calls API and navigates on successful registration", async () => {
    const successResponse = {
      data: {
        message: "Registration successful! You can now log in.",
        userId: "123",
      },
      status: 201,
    };
    axios.post.mockResolvedValue(successResponse);

    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/auth/register", {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      expect(
        screen.getByText(/registration successful! you can now log in./i)
      ).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        "Registration successful! You can now log in."
      );
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith("/auth/login");
      expect(submitButton).not.toBeDisabled(); // Ensure button is re-enabled
    });
  });

  // Test Case 7: Form Submission - Failed Registration (e.g., Duplicate User)
  test("displays error message on failed registration", async () => {
    const errorResponse = {
      response: {
        data: { message: "Username 'testuser' already exists" },
        status: 409,
      },
    };
    axios.post.mockRejectedValue(errorResponse);

    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/auth/register", {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      expect(
        screen.getByText(/username 'testuser' already exists/i)
      ).toBeInTheDocument();
      expect(mockedNavigate).not.toHaveBeenCalled(); // Navigation should not happen
      expect(submitButton).not.toBeDisabled(); // Ensure button is re-enabled
    });
  });

  // Test Case 8: Loading State
  test("disables submit button while loading", async () => {
    // Mock axios.post to return a promise that never resolves to simulate loading
    axios.post.mockImplementation(() => new Promise(() => {}));

    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    expect(submitButton).toBeDisabled();
  });

  // Test Case 9: Form Submission - Network Error
  test("displays generic error message on network error", async () => {
    axios.post.mockRejectedValue(new Error("Network error, server down"));

    await fillAndSubmitForm(
      user,
      {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        usernameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput,
        submitButton,
      }
    );

    await waitFor(() => {
      expect(
        screen.getByText("Network error, server down")
      ).toBeInTheDocument();
      expect(mockedNavigate).not.toHaveBeenCalled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });
});
