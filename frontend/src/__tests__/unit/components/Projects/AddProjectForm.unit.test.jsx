import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddProjectForm from '../../../../components/Projects/AddProjectForm';
import {
  renderWithMinimalProviders,
  fillForm,
  submitForm,
} from '../../../helpers/test-utils';
import { TestProjectProvider } from '../../../helpers/mock-providers';

describe('AddProjectForm Unit Tests', () => {
  let user;
  let mockAddProject;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockAddProject = jest.fn();
  });

  const renderAddProjectForm = (projectValue = {}) => {
    const defaultProjectValue = {
      addProject: mockAddProject,
      isLoading: false,
      error: null,
    };

    return renderWithMinimalProviders(
      <TestProjectProvider value={{ ...defaultProjectValue, ...projectValue }}>
        <AddProjectForm onSuccess={projectValue.onSuccess} />
      </TestProjectProvider>
    );
  };

  test('renders form elements correctly', () => {
    renderAddProjectForm();

    // Check for CardTitle
    expect(
      screen.getByText(/create new project/i)
    ).toBeInTheDocument();

    // Check for CardDescription
    expect(
      screen.getByText(/Enter a name for your new project below/i)
    ).toBeInTheDocument();

    // Check for Label and Input
    const projectNameInput = screen.getByLabelText(/project name/i);
    expect(projectNameInput).toBeInTheDocument();
    expect(projectNameInput).toHaveAttribute(
      'placeholder',
      'e.g., Work Tasks, Home Renovation'
    );

    // Check for Button
    expect(
      screen.getByRole('button', { name: /create project/i })
    ).toBeInTheDocument();
  });

  test('updates input value on user interaction', async () => {
    renderAddProjectForm();

    await fillForm(user, {
      'project name': 'New Awesome Project',
    });

    expect(screen.getByLabelText(/project name/i)).toHaveValue(
      'New Awesome Project'
    );
  });

  test('shows validation error for empty project name', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderAddProjectForm();

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument(); // Ensure form is found
    fireEvent.submit(form);

    expect(
      screen.getByText('Project name cannot be empty.')
    ).toBeInTheDocument();
    expect(mockAddProject).not.toHaveBeenCalled();
  });

  it('calls addProject and clears input on successful submission', async () => {
    mockAddProject.mockResolvedValue({ id: 'proj1', name: 'New Awesome Project' });
    const mockOnSuccess = jest.fn();

    renderAddProjectForm({ onSuccess: mockOnSuccess });

    await fillForm(user, {
      'project name': 'New Awesome Project',
    });
    await submitForm(user, /create project/i);

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith({ name: 'New Awesome Project' });
    });

    expect(screen.getByLabelText(/project name/i)).toHaveValue('');
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  test('displays error message when addProject fails', async () => {
    mockAddProject.mockRejectedValue(new Error('API Error'));

    renderAddProjectForm();

    await fillForm(user, {
      'project name': 'Test Project',
    });
    await submitForm(user, /create project/i);

    await waitFor(() => {
      // Verify it displays the contextual error from getErrorMessage
      const expectedMessage =
        /an unexpected error occurred while creating the project/i;
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  test('disables form elements during loading state', () => {
    renderAddProjectForm({ isLoading: true });

    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /creating.../i });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  test('handles form submission with loading state', async () => {
    let resolveAddProject;
    mockAddProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAddProject = resolve;
        })
    );

    renderAddProjectForm();

    await fillForm(user, {
      'project name': 'Test Project',
    });
    await submitForm(user, /create project/i);

    expect(mockAddProject).toHaveBeenCalledWith({ name: 'Test Project' });

    resolveAddProject({ id: 'proj1', name: 'Test Project' });

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toHaveValue('');
    });
  });
});
