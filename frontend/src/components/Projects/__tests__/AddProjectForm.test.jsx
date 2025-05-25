import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddProjectForm from '../AddProjectForm';
import AuthContext from '../../../context/AuthContext';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


const mockAuthContextValue = {
  token: 'test-token-123',
  logout: jest.fn(),
};

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthContextValue, ...providerProps }}>
      <MemoryRouter> {/* MemoryRouter is needed if the component uses useNavigate or Link */}
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>,
    renderOptions
  );
};

describe('AddProjectForm', () => {
  const mockOnProjectAdded = jest.fn();
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    expect(screen.getByRole('heading', { name: /create new project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });

  it('allows typing in the project name input', async () => {
    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    const input = screen.getByLabelText(/project name/i);
    await user.type(input, 'New Awesome Project');
    expect(input).toHaveValue('New Awesome Project');
  });

  it('shows an error if project name is empty on submit', async () => {
    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    // To test the JavaScript validation, we submit the form directly,
    // bypassing the browser's own 'required' attribute check on the input.
    const form = screen.getByRole('heading', { name: /create new project/i }).closest('form');
    fireEvent.submit(form);

    // The error message should now appear due to our JavaScript validation
    expect(screen.getByText('Project name cannot be empty.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
    expect(mockOnProjectAdded).not.toHaveBeenCalled();
  });

  it('submits the form, calls onProjectAdded, clears input, and shows success toast on successful creation', async () => {
    const newProjectData = { id: 'proj1', name: 'My New Project' };
    axios.post.mockResolvedValueOnce({ data: { project: newProjectData, message: 'Project created' } });

    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'My New Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/projects',
        { name: 'My New Project' },
        { headers: { Authorization: `Bearer ${mockAuthContextValue.token}` } }
      );
    });
    expect(mockOnProjectAdded).toHaveBeenCalledWith(newProjectData);
    expect(input).toHaveValue(''); // Input should be cleared
    expect(toast.success).toHaveBeenCalledWith('Project created successfully!');
  });

  it('shows an error message from the server on API error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Server validation failed' }, status: 400 },
    });

    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'Problematic Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server validation failed')).toBeInTheDocument();
    });
    expect(mockOnProjectAdded).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('handles 401 error by calling logout and navigating to login', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'Unauthorized Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    expect(screen.getByText('Unauthorized')).toBeInTheDocument(); // Error message should still be shown
  });

  it('disables form and shows "Creating..." on submit button during loading', async () => {
    // Make axios.post take some time to resolve
    axios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { project: {id: '1', name: 'Slow Project'} } }), 100)));

    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, {});
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'Slow Project');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();

    // Wait for the submission to complete to avoid state update errors
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

   it('shows an error if auth token is missing', async () => {
    renderWithContext(<AddProjectForm onProjectAdded={mockOnProjectAdded} />, { providerProps: { token: null } });
    const input = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(input, 'Project Without Token');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication error. Please log in again.')).toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    expect(axios.post).not.toHaveBeenCalled();
  });

});