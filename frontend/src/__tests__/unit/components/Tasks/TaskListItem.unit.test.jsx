import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskListItem from '../../../../components/Tasks/TaskListItem';
import {
  renderWithMinimalProviders,
  createMockTask,
} from '../../../helpers/test-utils';

describe('TaskListItem Unit Tests', () => {
  const renderTaskListItem = (props = {}) => {
    const defaultProps = {
      task: createMockTask(),
    };

    return renderWithMinimalProviders(
      <TaskListItem {...defaultProps} {...props} />
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
    rerender(<TaskListItem task={lowPriorityTask} />);

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
});
