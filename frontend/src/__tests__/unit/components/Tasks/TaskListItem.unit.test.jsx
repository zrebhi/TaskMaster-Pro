import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskListItem from '../../../../components/Tasks/TaskListItem';
import {
  renderWithMinimalProviders,
  createMockTask,
} from '../../../helpers/test-utils';
import {
  createMockTaskContext,
  TestTaskProvider,
} from '../../../helpers/mock-providers';

describe('TaskListItem Unit Tests', () => {
  const renderTaskListItem = (props = {}, taskContextValue = {}) => {
    const defaultProps = {
      task: createMockTask(),
    };

    const mockTaskContext = createMockTaskContext(taskContextValue);

    return renderWithMinimalProviders(
      <TestTaskProvider value={mockTaskContext}>
        <TaskListItem {...defaultProps} {...props} />
      </TestTaskProvider>
    );
  };

  test('renders with valid task data', () => {
    const mockTask = createMockTask({
      title: 'Test Task Title',
      description: 'Test task description',
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    expect(screen.getByText('Test task description')).toBeInTheDocument();
  });

  test('returns null when task is null', () => {
    const { container } = renderTaskListItem({ task: null });

    expect(container.firstChild).toBeNull();
  });

  test('formats and displays due date correctly', () => {
    const mockTask = createMockTask({
      due_date: '2024-12-25T00:00:00.000Z',
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.getByText(/Due: 12\/25\/2024/)).toBeInTheDocument();
  });

  test('handles invalid date gracefully', () => {
    const mockTask = createMockTask({
      due_date: 'invalid-date',
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.getByText(/Due:.*Invalid Date/)).toBeInTheDocument();
  });

  test.each([
    ['null', null],
    ['empty string', ''],
  ])('does not display due date when %s', (_, dueDate) => {
    const mockTask = createMockTask({ due_date: dueDate });
    renderTaskListItem({ task: mockTask });
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  test('does not display description when not present', () => {
    const mockTask = createMockTask({
      description: null,
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.queryByText('Test task description')).not.toBeInTheDocument();
  });

  test.each([
    [1, 'Low'],
    [2, 'Medium'],
    [3, 'High'],
    [999, 'Medium'],
  ])(
    'formats priority correctly - priority %i displays %s',
    (priority, expectedText) => {
      const mockTask = createMockTask({ priority });
      renderTaskListItem({ task: mockTask });
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    }
  );

  test('does not display priority when not present', () => {
    const mockTask = createMockTask({
      priority: null,
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.queryByText(/Low|Medium|High/)).not.toBeInTheDocument();
  });

  test('handles date formatting error gracefully', () => {
    const originalDate = global.Date;
    global.Date = jest.fn(() => {
      throw new Error('Date constructor error');
    });

    const mockTask = createMockTask({
      due_date: '2024-12-25',
    });

    renderTaskListItem({ task: mockTask });

    expect(screen.getByText('Due: 2024-12-25')).toBeInTheDocument();

    global.Date = originalDate;
  });

  test('applies correct styling for priority levels', () => {
    const highPriorityTask = createMockTask({ priority: 3 });
    const { rerender } = renderTaskListItem({ task: highPriorityTask });

    const highPriorityElement = screen.getByText('High');
    expect(highPriorityElement).toHaveStyle('background-color: #ffebee');
    expect(highPriorityElement).toHaveStyle('color: #c62828');

    const lowPriorityTask = createMockTask({ priority: 1 });
    const mockTaskContext = createMockTaskContext();
    rerender(
      <TestTaskProvider value={mockTaskContext}>
        <TaskListItem task={lowPriorityTask} />
      </TestTaskProvider>
    );

    const lowPriorityElement = screen.getByText('Low');
    expect(lowPriorityElement).toHaveStyle('background-color: #e8f5e8');
    expect(lowPriorityElement).toHaveStyle('color: #2e7d32');
  });

  test('renders as list item with correct structure', () => {
    renderTaskListItem();

    const listItem = screen.getByRole('listitem');
    expect(listItem).toBeInTheDocument();
    expect(listItem).toHaveStyle('display: flex');
    expect(listItem).toHaveStyle('justify-content: space-between');
  });

  test('calls updateTask when checkbox is clicked', async () => {
    const mockUpdateTask = jest.fn();
    const mockTask = createMockTask({
      id: 'task-123',
      title: 'Test Task',
      is_completed: false,
    });

    const user = userEvent.setup();
    renderTaskListItem({ task: mockTask }, { updateTask: mockUpdateTask });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-123', {
      is_completed: true,
    });
  });

  test('calls onEditClick when edit button is clicked', async () => {
    const mockOnEditClick = jest.fn();
    const mockTask = createMockTask({
      id: 'task-123',
      title: 'Test Task',
    });

    const user = userEvent.setup();
    renderTaskListItem({ task: mockTask, onEditClick: mockOnEditClick });

    const editButton = screen.getByRole('button', {
      name: /edit task "test task"/i,
    });
    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledWith(mockTask);
  });

  test('calls onDeleteClick when delete button is clicked', async () => {
    const mockOnDeleteClick = jest.fn();
    const mockTask = createMockTask({
      id: 'task-123',
      title: 'Test Task',
    });

    const user = userEvent.setup();
    renderTaskListItem({ task: mockTask, onDeleteClick: mockOnDeleteClick });

    const deleteButton = screen.getByRole('button', {
      name: /delete task "test task"/i,
    });
    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledWith(mockTask);
  });

  test('handles updateTask error gracefully', async () => {
    const mockUpdateTask = jest
      .fn()
      .mockRejectedValue(new Error('Update failed'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockTask = createMockTask({
      id: 'task-123',
      title: 'Test Task',
      is_completed: false,
    });

    const user = userEvent.setup();
    renderTaskListItem({ task: mockTask }, { updateTask: mockUpdateTask });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-123', {
      is_completed: true,
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to toggle task completion:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('applies completed task styling when task is completed', () => {
    const completedTask = createMockTask({
      title: 'Completed Task',
      description: 'Completed description',
      is_completed: true,
    });

    renderTaskListItem({ task: completedTask });

    const titleElement = screen.getByText('Completed Task');
    expect(titleElement).toHaveStyle('text-decoration: line-through');
    expect(titleElement).toHaveStyle('color: #888');

    const descriptionElement = screen.getByText('Completed description');
    expect(descriptionElement).toHaveStyle('text-decoration: line-through');
    expect(descriptionElement).toHaveStyle('color: #aaa');
  });

  test('disables buttons and checkbox when loading', () => {
    const mockTask = createMockTask({ title: 'Test Task' });
    renderTaskListItem({ task: mockTask }, { isLoadingTasks: true });

    const checkbox = screen.getByRole('checkbox');
    const editButton = screen.getByRole('button', { name: /edit task/i });
    const deleteButton = screen.getByRole('button', { name: /delete task/i });

    expect(checkbox).toBeDisabled();
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  test('checkbox reflects task completion state', () => {
    const incompletedTask = createMockTask({ is_completed: false });
    const { rerender } = renderTaskListItem({ task: incompletedTask });

    let checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    const completedTask = createMockTask({ is_completed: true });
    const mockTaskContext = createMockTaskContext();
    rerender(
      <TestTaskProvider value={mockTaskContext}>
        <TaskListItem task={completedTask} />
      </TestTaskProvider>
    );

    checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('handles missing onEditClick and onDeleteClick props gracefully', async () => {
    const mockTask = createMockTask({ title: 'Test Task' });
    const user = userEvent.setup();

    renderTaskListItem({
      task: mockTask,
      onEditClick: undefined,
      onDeleteClick: undefined,
    });

    const editButton = screen.getByRole('button', { name: /edit task/i });
    const deleteButton = screen.getByRole('button', { name: /delete task/i });

    // Should not throw errors when clicked
    await user.click(editButton);
    await user.click(deleteButton);

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});
