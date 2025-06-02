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
        <AddProjectForm />
      </TestProjectProvider>
    );
  };

  test('renders form elements correctly', () => {
    renderAddProjectForm();

    expect(
      screen.getByRole('heading', { name: /create new project/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
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
    renderAddProjectForm();

    const form = screen
      .getByRole('heading', { name: /create new project/i })
      .closest('form');
    fireEvent.submit(form);

    expect(
      screen.getByText('Project name cannot be empty.')
    ).toBeInTheDocument();
    expect(mockAddProject).not.toHaveBeenCalled();
  });

  test('calls addProject and clears input on successful submission', async () => {
    mockAddProject.mockResolvedValue({ id: 'proj1', name: 'My New Project' });

    renderAddProjectForm();

    await fillForm(user, {
      'project name': 'My New Project',
    });
    await submitForm(user, /create project/i);

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith({ name: 'My New Project' });
    });

    expect(screen.getByLabelText(/project name/i)).toHaveValue('');
  });

  test('displays error message when addProject fails', async () => {
    mockAddProject.mockRejectedValue(new Error('API Error'));

    renderAddProjectForm();

    await fillForm(user, {
      'project name': 'Test Project',
    });
    await submitForm(user, /create project/i);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to create project. Please try again.')
      ).toBeInTheDocument();
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
