/**
 * @file Integration tests for table interactions like sorting, filtering, and column visibility.
 */

import {
  // Import from our modern, shared test setup
  setupPageTests,
  renderProjectTasksPage,
  taskApiService,
  screen,
  waitFor,
  within,
} from './ProjectTasksPage.TestSetup';
import {
  createMockProject,
  createMockTask,
} from '@/__tests__/helpers/test-utils';

describe('ProjectTasksPage - Table Interactions', () => {
  let user;
  let queryClient;
  const testState = setupPageTests();

  beforeEach(() => {
    user = testState.user;
    queryClient = testState.queryClient;
  });

  // Helper to wait for the initial task list to be visible
  const waitForTableToLoad = async (tasks) => {
    for (const task of tasks) {
      await screen.findByText(task.title);
    }
  };

  describe('Column Visibility and Sorting', () => {
    const mockProject = createMockProject({ id: 'proj-1' });
    const tasks = [
      createMockTask({
        id: 'task-a',
        title: 'A Task',
        priority: 1,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-b',
        title: 'B Task',
        priority: 3,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-c',
        title: 'C Task',
        priority: 2,
        project_id: 'proj-1',
      }),
    ];

    it('should hide a column when it is deselected from the "View" menu', async () => {
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);

      // ASSERT initial state
      expect(
        screen.getByRole('columnheader', { name: /due date/i })
      ).toBeInTheDocument();

      // ACT
      await user.click(screen.getByRole('button', { name: /view/i }));
      await user.click(
        await screen.findByRole('option', { name: /due date/i })
      );

      // ASSERT final state
      expect(
        screen.queryByRole('columnheader', { name: /due date/i })
      ).not.toBeInTheDocument();
    });

    it('should reorder tasks when a sortable column header is clicked', async () => {
      // ARRANGE
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
      renderProjectTasksPage(queryClient, { projects: [mockProject] });

      await waitForTableToLoad(tasks);

      /**
       * A resilient helper that queries the DOM every time it's called.
       * This avoids stale closures by not relying on an external `tableContainer` variable.
       */
      const getTitleColumnText = () => {
        // --- FIX 2: Re-query the table on each call for maximum resilience ---
        const table = screen.getByRole('table');
        const headers = within(table).getAllByRole('columnheader');
        // Get all rows, and slice off the header row (index 0)
        const dataRows = within(table).getAllByRole('row').slice(1);

        const titleColumnIndex = headers.findIndex((h) =>
          /title/i.test(h.textContent || '')
        );
        if (titleColumnIndex === -1) {
          throw new Error('Title column not found');
        }

        return dataRows.map((row) => {
          const cells = row.querySelectorAll('td');
          return cells[titleColumnIndex]?.textContent || '';
        });
      };

      // ASSERT initial order
      await waitFor(() =>
        expect(getTitleColumnText()).toEqual(['A Task', 'B Task', 'C Task'])
      );

      // ACT 1: Sort by Priority
      const priorityHeader = screen.getByRole('columnheader', {
        name: /priority/i,
      });
      const priorityHeaderButton = within(priorityHeader).getByRole('button');
      await user.click(priorityHeaderButton);
      await user.click(await screen.findByText(/desc/i));

      // ASSERT 1: The `waitFor` block will retry our resilient helper
      // until the DOM update from sorting is complete.
      await waitFor(() =>
        expect(getTitleColumnText()).toEqual(['B Task', 'C Task', 'A Task'])
      );

      // ACT 2: Click again to sort ascending
      await user.click(priorityHeaderButton);
      await user.click(await screen.findByText(/asc/i));

      // ASSERT 2
      await waitFor(() =>
        expect(getTitleColumnText()).toEqual(['A Task', 'C Task', 'B Task'])
      );
    });
  });

  describe('Responsive Column Visibility with Persistence', () => {
    // These hooks manage global mocks for window size and localStorage
    const originalInnerWidth = window.innerWidth;
    const originalLocalStorage = window.localStorage;

    beforeAll(() => {
      let store = {};
      const localStorageMock = {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
        get length() {
          return Object.keys(store).length;
        },
        key: jest.fn((i) => Object.keys(store)[i] || null),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    });

    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true,
      });
    });

    afterAll(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
      });
    });

    const mockProject = createMockProject({ id: 'proj-1' });
    const tasks = [
      createMockTask({ id: 'task-1', title: 'A Task', project_id: 'proj-1' }),
    ];

    it('should hide the "Due Date" column by default on mobile screens', async () => {
      // ARRANGE: Mobile screen, API mock
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true,
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);

      // ACT: Render the component
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);

      // ASSERT
      expect(
        screen.queryByRole('columnheader', { name: /due date/i })
      ).not.toBeInTheDocument();
    });

    it('should show the "Due Date" column by default on desktop screens', async () => {
      // ARRANGE: Desktop screen, API mock
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true,
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);

      // ACT
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);

      // ASSERT
      expect(
        screen.getByRole('columnheader', { name: /due date/i })
      ).toBeInTheDocument();
    });

    it('should remember the user’s choice to show a column across re-renders', async () => {
      // ARRANGE: Mobile screen, initially hides Due Date
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true,
      });
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
      const { unmount } = renderProjectTasksPage(queryClient, {
        projects: [mockProject],
      });
      await waitForTableToLoad(tasks);
      expect(
        screen.queryByRole('columnheader', { name: /due date/i })
      ).not.toBeInTheDocument();

      // ACT 1: User explicitly shows the column
      await user.click(screen.getByRole('button', { name: /view/i }));
      await user.click(
        await screen.findByRole('option', { name: /due date/i })
      );
      expect(
        screen.getByRole('columnheader', { name: /due date/i })
      ).toBeInTheDocument();

      // ACT 2: "Reload" the component (unmount and re-render)
      unmount();
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);

      // ASSERT: The choice is remembered despite the mobile default
      expect(
        screen.getByRole('columnheader', { name: /due date/i })
      ).toBeInTheDocument();
    });
  });

  describe('Interactive Filtering', () => {
    const mockProject = createMockProject({ id: 'proj-1' });
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task Done High',
        is_completed: true,
        priority: 3,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-2',
        title: 'Task ToDo High',
        is_completed: false,
        priority: 3,
        project_id: 'proj-1',
      }),
      createMockTask({
        id: 'task-3',
        title: 'Task ToDo Medium',
        is_completed: false,
        priority: 2,
        project_id: 'proj-1',
      }),
    ];

    beforeEach(() => {
      // Provide the mock data for each test in this suite
      taskApiService.getTasksForProjectAPI.mockResolvedValue(tasks);
    });

    it('should filter by a single facet value', async () => {
      // ARRANGE
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);
      const toolbar = screen.getByRole('toolbar');

      // ACT
      await user.click(
        within(toolbar).getByRole('button', { name: /status/i })
      );
      await user.click(await screen.findByRole('option', { name: /done/i }));

      // ASSERT
      await waitFor(() => {
        expect(screen.queryByText('Task ToDo High')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Task Done High')).toBeInTheDocument();
    });

    it('should combine filters from different facets (status and priority)', async () => {
      // ARRANGE
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);
      const toolbar = screen.getByRole('toolbar');

      // ACT
      await user.click(
        within(toolbar).getByRole('button', { name: /priority/i })
      );
      await user.click(await screen.findByRole('option', { name: /medium/i }));
      await user.click(
        within(toolbar).getByRole('button', { name: /status/i })
      );
      await user.click(await screen.findByRole('option', { name: /to do/i }));

      // ASSERT: Only the task matching "ToDo" AND "Medium" is visible
      await waitFor(() => {
        expect(screen.queryByText('Task Done High')).not.toBeInTheDocument();
        expect(screen.queryByText('Task ToDo High')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Task ToDo Medium')).toBeInTheDocument();
    });

    it('should clear all active filters when the "Reset" button is clicked', async () => {
      // ARRANGE
      renderProjectTasksPage(queryClient, { projects: [mockProject] });
      await waitForTableToLoad(tasks);
      const toolbar = screen.getByRole('toolbar');

      // ACT 1: Apply a filter
      await user.click(
        within(toolbar).getByRole('button', { name: /status/i })
      );
      await user.click(await screen.findByRole('option', { name: /done/i }));
      await waitFor(() => {
        expect(screen.queryByText('Task ToDo High')).not.toBeInTheDocument();
      });

      // ACT 2: Reset the filters
      await user.click(within(toolbar).getByRole('button', { name: /reset/i }));

      // ASSERT: All tasks are visible again
      await waitFor(() => {
        expect(screen.getByText('Task Done High')).toBeInTheDocument();
        expect(screen.getByText('Task ToDo High')).toBeInTheDocument();
        expect(screen.getByText('Task ToDo Medium')).toBeInTheDocument();
      });
    });
  });
});
