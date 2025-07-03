import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from '@/components/Tasks/TaskList';
import {
  renderWithMinimalProviders,
  createMockTask,
} from '@/__tests__/helpers/test-utils';

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectListStructure", "expectTasksWithTitles", "expectTaskItemsToBeRendered"] }] */

// Mock TaskListItem to isolate TaskList testing
jest.mock('@/components/Tasks/TaskListItem', () => {
  return function MockTaskListItem({ task }) {
    // Handle tasks without IDs for testing
    const testId = task.id
      ? `task-item-${task.id}`
      : `task-item-no-id-${task.title?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`;

    return (
      <li data-testid={testId} data-task-title={task.title}>
        {task.title}
      </li>
    );
  };
});

describe('TaskList Unit Tests', () => {
  const renderTaskList = (props = {}) => {
    const defaultProps = {
      tasks: [],
    };

    return renderWithMinimalProviders(
      <TaskList {...defaultProps} {...props} />
    );
  };

  // Helper function to create multiple tasks with sequential IDs
  const createTaskArray = (count, baseProps = {}) => {
    return Array.from({ length: count }, (_, index) =>
      createMockTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        ...baseProps,
      })
    );
  };

  // Helper function to assert task items are rendered correctly
  const expectTaskItemsToBeRendered = (taskIds) => {
    taskIds.forEach((id) => {
      expect(screen.getByTestId(`task-item-${id}`)).toBeInTheDocument();
    });
  };

  // Helper function to assert list structure
  const expectListStructure = (shouldExist = true) => {
    const list = screen.queryByRole('list');
    if (shouldExist) {
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('UL');
    } else {
      expect(list).not.toBeInTheDocument();
    }
  };

  // Helper function to assert task rendering with titles (WET principle - used 3+ times)
  const expectTasksWithTitles = (tasks) => {
    const taskIds = tasks.map((task) => task.id);
    expectTaskItemsToBeRendered(taskIds);
    tasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  };

  describe('Basic Rendering', () => {
    test.each([
      ['empty array', []],
      ['null', null],
      ['undefined', undefined],
    ])('renders null when tasks is %s', (_, tasks) => {
      const { container } = renderTaskList({ tasks });
      expect(container.firstChild).toBeNull();
    });

    test('renders unordered list when tasks are provided', () => {
      const tasks = createTaskArray(1);
      renderTaskList({ tasks });
      expectListStructure(true);
    });
  });

  describe('Task Rendering', () => {
    test('renders single task correctly', () => {
      const task = createMockTask({ id: 'task-1', title: 'Single Task' });
      renderTaskList({ tasks: [task] });

      expectTasksWithTitles([task]);
    });

    test('renders multiple tasks correctly', () => {
      const tasks = createTaskArray(3);
      renderTaskList({ tasks });

      expectTasksWithTitles(tasks);
      // Verify correct count as well
      expect(screen.getAllByTestId(/^task-item-/)).toHaveLength(3);
    });
  });

  describe('Props and Data Handling', () => {
    test('passes correct task data to TaskListItem components', () => {
      const task = createMockTask({
        id: 'task-123',
        title: 'Test Task Title',
        description: 'Test Description',
        priority: 2,
      });
      renderTaskList({ tasks: [task] });

      const taskItem = screen.getByTestId('task-item-task-123');
      expect(taskItem).toHaveAttribute('data-task-title', 'Test Task Title');
    });

    test('handles tasks with different data structures', () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Complete Task', priority: 3 }),
        createMockTask({ id: 'task-2', title: 'Minimal Task' }), // minimal data
        createMockTask({
          id: 'task-3',
          title: 'Full Task',
          description: 'Full description',
          priority: 1,
          due_date: '2024-12-31',
        }),
      ];
      renderTaskList({ tasks });

      expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-3')).toBeInTheDocument();
    });
  });

  describe('List Structure and Styling', () => {
    test('applies correct list styles', () => {
      const tasks = [createMockTask({ id: 'task-1', title: 'Test Task' })];
      renderTaskList({ tasks });

      const list = screen.getByRole('list');
      expect(list).toHaveStyle({
        listStyleType: 'none',
        padding: '0',
        marginTop: '20px',
      });
    });

    test('maintains proper key props for list items', () => {
      const tasks = [
        createMockTask({ id: 'unique-1', title: 'Task 1' }),
        createMockTask({ id: 'unique-2', title: 'Task 2' }),
      ];
      renderTaskList({ tasks });

      // React keys are not directly testable, but we can verify unique IDs
      expect(screen.getByTestId('task-item-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-unique-2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty task objects gracefully', () => {
      // Use a task with an ID to avoid key warnings
      const tasks = [
        createMockTask({ id: 'empty-task', title: '', description: '' }),
      ];
      const { container } = renderTaskList({ tasks });

      // Should still render the list structure
      expect(container.querySelector('ul')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-empty-task')).toBeInTheDocument();
    });

    test('handles tasks with missing IDs using fallback keys', () => {
      const tasks = [
        { title: 'Task without ID' },
        createMockTask({ id: 'task-with-id', title: 'Task with ID' }),
        { title: 'Another task without ID' },
      ];

      // Should not crash and should render all tasks
      expect(() => renderTaskList({ tasks })).not.toThrow();

      // Verify all tasks are rendered despite missing IDs
      expect(screen.getByText('Task without ID')).toBeInTheDocument();
      expect(screen.getByText('Task with ID')).toBeInTheDocument();
      expect(screen.getByText('Another task without ID')).toBeInTheDocument();

      // Verify specific test IDs for tasks without IDs
      expect(
        screen.getByTestId('task-item-no-id-task-without-id')
      ).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-with-id')).toBeInTheDocument();
      expect(
        screen.getByTestId('task-item-no-id-another-task-without-id')
      ).toBeInTheDocument();

      // Verify correct number of task items
      expect(screen.getAllByTestId(/^task-item-/)).toHaveLength(3);
    });

    test('generates unique fallback keys for tasks without IDs', () => {
      const tasks = [
        { title: 'Duplicate Title' },
        { title: 'Duplicate Title' },
        createMockTask({ id: 'task-1', title: 'Unique Task' }),
        { title: 'Duplicate Title' },
      ];

      // Should not crash despite duplicate titles and missing IDs
      expect(() => renderTaskList({ tasks })).not.toThrow();

      // All tasks should be rendered
      const taskItems = screen.getAllByTestId(/^task-item-/);
      expect(taskItems).toHaveLength(4);

      // Verify the task with ID is rendered correctly
      expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument();
      expect(screen.getByText('Unique Task')).toBeInTheDocument();

      // Verify all duplicate title tasks are rendered (React should handle key uniqueness via index fallback)
      const duplicateTasks = screen.getAllByText('Duplicate Title');
      expect(duplicateTasks).toHaveLength(3);
    });

    test('handles large number of tasks efficiently', () => {
      const tasks = createTaskArray(100);
      renderTaskList({ tasks });

      expectListStructure(true);
      expect(screen.getAllByTestId(/^task-item-/)).toHaveLength(100);
    });

    test.each([
      [
        'special characters',
        'task-with-special-chars-!@#$%',
        'Task with special chars: !@#$%^&*()',
      ],
      [
        'unicode characters',
        'task-with-unicode-🚀',
        'Task with unicode: 🚀 🎯 ✅',
      ],
    ])('handles tasks with %s in IDs and titles', (_, id, title) => {
      const task = createMockTask({ id, title });
      renderTaskList({ tasks: [task] });

      expect(screen.getByTestId(`task-item-${id}`)).toBeInTheDocument();
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    test('preserves task order in rendering', () => {
      const tasks = [
        createMockTask({ id: 'first', title: 'First Task' }),
        createMockTask({ id: 'second', title: 'Second Task' }),
        createMockTask({ id: 'third', title: 'Third Task' }),
      ];

      renderTaskList({ tasks });

      const taskItems = screen.getAllByTestId(/^task-item-/);
      expect(taskItems[0]).toHaveAttribute('data-testid', 'task-item-first');
      expect(taskItems[1]).toHaveAttribute('data-testid', 'task-item-second');
      expect(taskItems[2]).toHaveAttribute('data-testid', 'task-item-third');
    });

    test('re-renders correctly when tasks prop changes', () => {
      const initialTasks = [createMockTask({ id: 'task-1', title: 'Task 1' })];
      const { rerender } = renderTaskList({ tasks: initialTasks });

      expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument();

      const newTasks = [
        createMockTask({ id: 'task-2', title: 'Task 2' }),
        createMockTask({ id: 'task-3', title: 'Task 3' }),
      ];

      rerender(<TaskList tasks={newTasks} />);

      expect(screen.queryByTestId('task-item-task-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-item-task-3')).toBeInTheDocument();
    });

    test('handles dynamic task updates correctly', () => {
      const { rerender } = renderTaskList({ tasks: [] });

      // Initially empty
      expectListStructure(false);

      // Add tasks
      const tasks = [
        createMockTask({ id: 'dynamic-task', title: 'Dynamic Task' }),
      ];
      rerender(<TaskList tasks={tasks} />);

      expectListStructure(true);
      expectTasksWithTitles(tasks);

      // Remove tasks
      rerender(<TaskList tasks={[]} />);
      expectListStructure(false);
    });
  });
});
