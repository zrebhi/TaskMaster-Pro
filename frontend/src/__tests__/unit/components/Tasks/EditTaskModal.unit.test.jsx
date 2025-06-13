import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditTaskModal from '../../../../components/Tasks/EditTaskModal';
import {
  renderWithMinimalProviders,
  fillForm,
  submitForm,
  expectErrorMessage,
  createMockTask,
  cleanupMocks,
} from '../../../helpers/test-utils';
import { TestTaskProvider } from '../../../helpers/mock-providers';

describe('EditTaskModal Unit Tests', () => {
  let user;
  let mockUpdateTask;
  let mockOnClose;

  beforeEach(() => {
    cleanupMocks();
    user = userEvent.setup({ delay: null }); // Disable delay for faster tests
    mockUpdateTask = jest.fn();
    mockOnClose = jest.fn();
    jest.useFakeTimers(); // Use fake timers for consistent async behavior
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Ensure all timers are cleared
    jest.useRealTimers(); // Restore real timers
  });

  // Helper function for date creation
  const createDateOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const renderEditTaskModal = (
    taskValue = {},
    task = createMockTask(),
    isOpen = true
  ) => {
    const defaultTaskValue = {
      updateTask: mockUpdateTask,
      isLoadingTasks: false,
      taskError: null,
    };

    return renderWithMinimalProviders(
      <TestTaskProvider value={{ ...defaultTaskValue, ...taskValue }}>
        <EditTaskModal task={task} isOpen={isOpen} onClose={mockOnClose} />
      </TestTaskProvider>
    );
  };

  describe('Modal Rendering', () => {
    test('renders modal with form elements and pre-fills with task data', () => {
      const task = createMockTask({
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2024-12-31',
        priority: 3,
      });

      renderEditTaskModal({}, task);

      // Check modal structure
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();

      // Check pre-filled values
      expect(screen.getByLabelText(/task title/i)).toHaveValue('Test Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Test Description'
      );
      expect(screen.getByLabelText(/due date/i)).toHaveValue('2024-12-31');
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent('High');
    });

    test('does not render when isOpen is false', () => {
      renderEditTaskModal({}, createMockTask(), false);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('updates form when task prop changes', () => {
      const initialTask = createMockTask({
        title: 'Initial Task',
        description: 'Initial Description',
        priority: 1,
      });

      const { rerender } = renderEditTaskModal({}, initialTask);

      // Verify initial values
      expect(screen.getByLabelText(/task title/i)).toHaveValue('Initial Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Initial Description'
      );
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent('Low');

      // Change the task prop
      const updatedTask = createMockTask({
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 3,
      });

      rerender(
        <TestTaskProvider
          value={{ updateTask: mockUpdateTask, isLoadingTasks: false }}
        >
          <EditTaskModal
            task={updatedTask}
            isOpen={true}
            onClose={mockOnClose}
          />
        </TestTaskProvider>
      );

      // Verify form updates with new task data
      expect(screen.getByLabelText(/task title/i)).toHaveValue('Updated Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Updated Description'
      );
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent('High');
    });

    test('handles task with falsy properties (null, undefined, empty strings)', () => {
      const taskWithFalsyProps = createMockTask({
        title: null,
        description: undefined,
        due_date: '',
        priority: 0, // Falsy number
      });

      renderEditTaskModal({}, taskWithFalsyProps);

      // Should use fallback values for all falsy properties
      expect(screen.getByLabelText(/task title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/due date/i)).toHaveValue('');
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent('Medium'); // Default fallback
    });

    test('useEffect handles task changing to null', () => {
      const initialTask = createMockTask({
        title: 'Initial Task',
        priority: 1,
      });

      const { rerender } = renderEditTaskModal({}, initialTask);

      // Verify initial values
      expect(screen.getByLabelText(/task title/i)).toHaveValue('Initial Task');

      // Change task to null - the form should retain its previous values
      // as the useEffect only updates if 'task' is truthy.
      rerender(
        <TestTaskProvider
          value={{ updateTask: mockUpdateTask, isLoadingTasks: false }}
        >
          <EditTaskModal task={null} isOpen={true} onClose={mockOnClose} />
        </TestTaskProvider>
      );

      // The modal should still be open if isOpen is true
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // The form fields should retain their previous values, not reset
      expect(screen.getByLabelText(/task title/i)).toHaveValue('Initial Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Test task description'
      );
      expect(screen.getByLabelText(/due date/i)).toHaveValue('');
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent('Low');
    });
  });

  describe('Modal Behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      renderEditTaskModal();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when escape key is pressed', async () => {
      renderEditTaskModal();

      // The Dialog component's content is the element that receives focus for escape key
      const dialogContent = screen.getByRole('dialog');
      dialogContent.focus();
      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when escape is pressed during loading', async () => {
      renderEditTaskModal({ isLoadingTasks: true });

      // Test escape key
      const dialogContent = screen.getByRole('dialog');
      dialogContent.focus();
      await user.keyboard('{Escape}');
      // Expect onClose not to be called if isLoadingTasks is true
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('HTML5 validation prevents empty title submission', async () => {
      const task = createMockTask({ title: 'Original Title' });
      renderEditTaskModal({}, task);

      // Clear the title field
      const titleInput = screen.getByLabelText(/task title/i);
      await user.clear(titleInput);

      // HTML5 required attribute should prevent submission
      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Form should not submit due to HTML5 validation
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });

    it('shows error for whitespace-only title', async () => {
      const task = createMockTask({ title: 'Original Title' });
      renderEditTaskModal({}, task);

      await fillForm(user, { 'task title': '   ' });
      await submitForm(user, /save changes/i);

      expectErrorMessage('Task title cannot be empty or contain only spaces.');
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });

    it('HTML5 maxLength prevents typing beyond 255 characters', async () => {
      const task = createMockTask();
      renderEditTaskModal({}, task);

      const titleInput = screen.getByLabelText(/task title/i);
      const longTitle = 'a'.repeat(300);

      await user.clear(titleInput);
      await user.type(titleInput, longTitle);

      // HTML5 maxLength should limit to 255 characters
      expect(titleInput.value).toHaveLength(255);
    });

    it('shows error for past due date', async () => {
      const task = createMockTask();
      renderEditTaskModal({}, task);
      const pastDate = createDateOffset(-1);

      await fillForm(user, {
        'task title': 'Valid Title',
        'due date': pastDate,
      });
      await submitForm(user, /save changes/i);

      expectErrorMessage('Due date cannot be in the past.');
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with minimal data (title only)', async () => {
      const task = createMockTask({
        id: 'task-123',
        title: 'Original Title',
        description: null,
        priority: 2,
      });
      mockUpdateTask.mockResolvedValue({
        id: 'task-123',
        title: 'Updated Task',
      });
      renderEditTaskModal({}, task);

      await fillForm(user, { 'task title': 'Updated Task' });
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith('task-123', {
          title: 'Updated Task',
          description: null,
          due_date: null,
          priority: 2,
        });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('submits form with all fields filled', async () => {
      const task = createMockTask({ id: 'task-456' });
      mockUpdateTask.mockResolvedValue({ id: 'task-456' });
      renderEditTaskModal({}, task);

      const futureDate = createDateOffset(1);

      await fillForm(user, {
        'task title': 'Complete Task',
        description: 'This is a detailed description',
        'due date': futureDate,
      });

      // Change priority to High using shadCN Select interaction
      // Using fireEvent to avoid 'target.hasPointerCapture' error with Radix UI components
      fireEvent.click(screen.getByRole('combobox', { name: /priority/i })); // Open the select dropdown

      jest.runAllTimers(); // Flush timers for Radix UI animations/transitions

      await waitFor(() =>
        expect(
          screen.getByRole('option', { name: /high/i })
        ).toBeInTheDocument()
      );
      await user.click(screen.getByRole('option', { name: /high/i })); // Select 'High'
      jest.runAllTimers(); // Flush timers after selection
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith('task-456', {
          title: 'Complete Task',
          description: 'This is a detailed description',
          due_date: futureDate,
          priority: 3,
        });
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('trims whitespace from title and description', async () => {
      const task = createMockTask({
        id: 'task-789',
        priority: 2,
      });
      mockUpdateTask.mockResolvedValue({ id: 'task-789' });
      renderEditTaskModal({}, task);

      await fillForm(user, {
        'task title': '  Trimmed Title  ',
        description: '  Trimmed Description  ',
      });
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith('task-789', {
          title: 'Trimmed Title',
          description: 'Trimmed Description',
          due_date: null,
          priority: 2,
        });
      });
    });

    it('converts empty description to null', async () => {
      const task = createMockTask({
        id: 'task-empty',
        priority: 2,
      });
      mockUpdateTask.mockResolvedValue({ id: 'task-empty' });
      renderEditTaskModal({}, task);

      // Clear the description field manually instead of using fillForm with empty string
      const titleInput = screen.getByLabelText(/task title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.clear(titleInput);
      await user.type(titleInput, 'Task with empty description');
      await user.clear(descriptionInput);

      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith('task-empty', {
          title: 'Task with empty description',
          description: null,
          due_date: null,
          priority: 2,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('disables form elements during loading', () => {
      const task = createMockTask();
      renderEditTaskModal({ isLoadingTasks: true }, task);

      expect(screen.getByLabelText(/task title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/due date/i)).toBeDisabled();
      // For shadCN Select, check the combobox (trigger) and the hidden input
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows error when updateTask fails', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const task = createMockTask();
      const apiError = new Error('API Error');
      mockUpdateTask.mockRejectedValue(apiError);
      renderEditTaskModal({}, task);

      await fillForm(user, { 'task title': 'Updated Task' });
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expectErrorMessage('Failed to update task. Please try again.');
      });

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Update task error:', apiError);

      // Modal should not close on error
      expect(mockOnClose).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('clears error when form is resubmitted', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const task = createMockTask();
      const apiError = new Error('API Error');
      mockUpdateTask.mockRejectedValueOnce(apiError);
      mockUpdateTask.mockResolvedValueOnce({ id: task.id });
      renderEditTaskModal({}, task);

      // First submission fails
      await fillForm(user, { 'task title': 'Updated Task' });
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expectErrorMessage('Failed to update task. Please try again.');
      });

      // Verify error was logged on first submission
      expect(consoleSpy).toHaveBeenCalledWith('Update task error:', apiError);

      // Second submission succeeds
      await submitForm(user, /save changes/i);

      await waitFor(() => {
        expect(
          screen.queryByText(/failed to update task/i)
        ).not.toBeInTheDocument();
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });
});
