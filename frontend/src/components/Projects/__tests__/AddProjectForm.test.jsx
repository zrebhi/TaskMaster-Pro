import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddProjectForm from '../AddProjectForm';
import AuthContext from '../../../context/AuthContext';
import ProjectContext from '../../../context/ProjectContext';

// Mock ProjectContext
const mockAddProject = jest.fn();
const mockProjectContextValue = {
  addProject: mockAddProject,
  isLoading: false,
  error: null,
};

// Mock AuthContext (needed for renderWithContext, though AddProjectForm itself doesn't use it directly anymore)
const mockAuthContextValue = {
  token: 'test-token-123',
  logout: jest.fn(),
  isAuthenticated: true, // Assuming authenticated for most tests
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

describe('AddProjectForm', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    renderWithContext(<AddProjectForm />, {});
    expect(screen.getByRole('heading', { name: /create new project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });

  it('allows typing in the project name input', async () => {
    renderWithContext(<AddProjectForm />, {});
    const input = screen.getByLabelText(/project name/i);
    await user.type(input, 'New Awesome Project');
    expect(input).toHaveValue('New Awesome Project');
  });

  it('shows an error if project name is empty on submit', async () => {
    renderWithContext(<AddProjectForm />, {});
    // To test the JavaScript validation, we submit the form directly,
    // bypassing the browser's own 'required' attribute check on the input.
    const form = screen.getByRole('heading', { name: /create new project/i }).closest('form');
    fireEvent.submit(form);

    // The error message should now appear due to our JavaScript validation
    expect(screen.getByText('Project name cannot be empty.')).toBeInTheDocument();
    expect(mockAddProject).not.toHaveBeenCalled(); // Should not call context if local validation fails
  });

  it('calls addProject from ProjectContext and clears input on successful submission', async () => {
    // Simulate successful addProject call from context
    mockAddProject.mockResolvedValueOnce({ id: 'proj1', name: 'My New Project' });

    renderWithContext(<AddProjectForm />, {});
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'My New Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledTimes(1);
      expect(mockAddProject).toHaveBeenCalledWith({ name: 'My New Project' });
    });
    expect(input).toHaveValue(''); // Input should be cleared
    // Toast success is handled by ProjectContext, not AddProjectForm
  });

  it('shows an error message from ProjectContext on submission error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress expected console errors for this test
    const errorMessage = 'Failed to create project. Please try again.'; // Updated to match rendered text
    // Simulate addProject throwing an error
    mockAddProject.mockRejectedValueOnce(new Error('API Error')); // The component displays the error from context state

    renderWithContext(<AddProjectForm />, { projectProviderProps: { error: errorMessage } }); // Provide error via context mock
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'Problematic Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledTimes(1);
      expect(mockAddProject).toHaveBeenCalledWith({ name: 'Problematic Project' });
      // Check for error message from context, using a more flexible matcher based on feedback
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables form and shows "Creating..." on submit button when ProjectContext is loading', async () => {
    // Simulate isLoading state from ProjectContext
    renderWithContext(<AddProjectForm />, { projectProviderProps: { isLoading: true } });
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /creating.../i }); // Button text changes when loading

    // No need to type and click, just check initial state when isLoading is true
    expect(submitButton).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
    expect(mockAddProject).not.toHaveBeenCalled(); // Should not call addProject just because it's loading
  });
});