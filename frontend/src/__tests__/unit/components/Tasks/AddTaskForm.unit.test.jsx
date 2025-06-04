import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddTaskForm from '../../../../components/Tasks/AddTaskForm';
import {
  renderWithMinimalProviders,
  fillForm,
  submitForm,
  expectErrorMessage,
} from '../../../helpers/test-utils';
import { TestTaskProvider } from '../../../helpers/mock-providers';

describe('AddTaskForm Unit Tests', () => {
  let user;
  let mockAddTask;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockAddTask = jest.fn();
  });

  // Helper function for date creation (WET principle - appears 3+ times)
  const createDateOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const renderAddTaskForm = (taskValue = {}, projectId = 'project-123') => {
    const defaultTaskValue = {
      addTask: mockAddTask,
      isLoadingTasks: false,
      taskError: null,
    };

    return renderWithMinimalProviders(
      <TestTaskProvider value={{ ...defaultTaskValue, ...taskValue }}>
        <AddTaskForm projectId={projectId} />
      </TestTaskProvider>
    );
  };

  describe('Form Rendering', () => {
    test('renders all form elements with correct default values', () => {
      renderAddTaskForm();

      // Check all form elements are present
      expect(
        screen.getByRole('heading', { name: /create new task/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create task/i })
      ).toBeInTheDocument();

      // Check default values
      expect(screen.getByLabelText(/task title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/due date/i)).toHaveValue('');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('2'); // Medium
    });
  });

  describe('Form Validation', () => {
    test('HTML5 validation prevents empty title submission', async () => {
      renderAddTaskForm();

      // HTML5 required attribute should prevent submission
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      // Form should not submit due to HTML5 validation
      expect(mockAddTask).not.toHaveBeenCalled();
    });

    test('shows error for whitespace-only title', async () => {
      renderAddTaskForm();

      await fillForm(user, { 'task title': '   ' });
      await submitForm(user, /create task/i);

      expectErrorMessage('Task title cannot be empty or contain only spaces.');
      expect(mockAddTask).not.toHaveBeenCalled();
    });

    test('HTML5 maxLength prevents typing beyond 255 characters', async () => {
      renderAddTaskForm();

      const titleInput = screen.getByLabelText(/task title/i);
      const longTitle = 'a'.repeat(300);

      await user.type(titleInput, longTitle);

      // HTML5 maxLength should limit to 255 characters
      expect(titleInput.value).toHaveLength(255);
    });

    test('shows error for past due date', async () => {
      renderAddTaskForm();
      const pastDate = createDateOffset(-1);

      await fillForm(user, {
        'task title': 'Valid Title',
        'due date': pastDate,
      });
      await submitForm(user, /create task/i);

      expectErrorMessage('Due date cannot be in the past.');
      expect(mockAddTask).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('submits form with minimal data (title only)', async () => {
      mockAddTask.mockResolvedValue({ id: 'task-1', title: 'Test Task' });
      renderAddTaskForm();

      await fillForm(user, { 'task title': 'Test Task' });
      await submitForm(user, /create task/i);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith('project-123', {
          title: 'Test Task',
          description: null,
          due_date: null,
          priority: 2,
        });
      });
    });

    test('submits form with all fields filled', async () => {
      mockAddTask.mockResolvedValue({ id: 'task-1' });
      renderAddTaskForm();

      const futureDate = createDateOffset(1);

      await fillForm(user, {
        'task title': 'Complete Task',
        description: 'This is a detailed description',
        'due date': futureDate,
      });

      // Change priority to High
      await user.selectOptions(screen.getByLabelText(/priority/i), '3');

      await submitForm(user, /create task/i);

      await waitFor(() => {
        expect(mockAddTask).toHaveBeenCalledWith('project-123', {
          title: 'Complete Task',
          description: 'This is a detailed description',
          due_date: futureDate,
          priority: 3,
        });
      });
    });

    test('resets form after successful submission', async () => {
      mockAddTask.mockResolvedValue({ id: 'task-1' });
      renderAddTaskForm();

      await fillForm(user, {
        'task title': 'Test Task',
        description: 'Test Description',
      });
      await submitForm(user, /create task/i);

      await waitFor(() => {
        expect(screen.getByLabelText(/task title/i)).toHaveValue('');
        expect(screen.getByLabelText(/description/i)).toHaveValue('');
        expect(screen.getByLabelText(/due date/i)).toHaveValue('');
        expect(screen.getByLabelText(/priority/i)).toHaveValue('2');
      });
    });
  });

  describe('Loading States', () => {
    test('disables form elements during loading', () => {
      renderAddTaskForm({ isLoadingTasks: true });

      expect(screen.getByLabelText(/task title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/due date/i)).toBeDisabled();
      expect(screen.getByLabelText(/priority/i)).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /creating.../i })
      ).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('shows error when addTask fails', async () => {
      mockAddTask.mockRejectedValue(new Error('API Error'));
      renderAddTaskForm();

      await fillForm(user, { 'task title': 'Test Task' });
      await submitForm(user, /create task/i);

      await waitFor(() => {
        expectErrorMessage('Failed to create task. Please try again.');
      });
    });

    test('shows error when no project is selected', async () => {
      renderAddTaskForm({}, null); // No projectId

      await fillForm(user, { 'task title': 'Test Task' });
      await submitForm(user, /create task/i);

      expectErrorMessage('No project selected.');
      expect(mockAddTask).not.toHaveBeenCalled();
    });
  });
});
