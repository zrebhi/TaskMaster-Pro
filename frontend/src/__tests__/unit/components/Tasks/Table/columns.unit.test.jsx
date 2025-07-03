// @ts-check
/**
 * @file Unit tests for the Task table's column definitions.
 */

import { render, screen } from '@testing-library/react';
import { columns } from '@/components/Tasks/Table/columns';

// Note: Mocks for Badge, icons, and row actions are no longer needed for
// the remaining unit tests, but are kept here in case other simple, pure
// cell renderers are added in the future.

// Mock child components to isolate the logic in `columns.jsx`.
jest.mock('@/components/ui/badge', () => ({
  Badge: jest.fn(({ variant, children }) => (
    <div data-testid="badge" data-variant={variant}>
      {children}
    </div>
  )),
}));

// Mock icons to verify they are rendered without depending on the actual SVG.
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  CircleIcon: () => <div data-testid="icon-todo" />,
  CheckCircle2Icon: () => <div data-testid="icon-done" />,
}));

// Mock the actions component to verify that the correct handlers are passed.
jest.mock('@/components/ui/tables/data-table-row-actions', () => ({
  DataTableRowActions: jest.fn(() => (
    <div data-testid="row-actions">Actions</div>
  )),
}));

// Helper function to find a specific column definition from the columns array.
const getColumn = (accessorKey) => {
  return columns.find(
    (col) => col.accessorKey === accessorKey || col.id === accessorKey
  );
};

describe('Task Table Columns: Unit Tests', () => {
  // Reset mocks before each test to ensure a clean state between tests.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // The Priority and Status cells are now interactive components whose behavior
  // is tested more effectively and resiliently in the ProjectTasksPage
  // integration tests. Unit testing them here would require brittle mocks
  // of the table's internal state.

  describe('Date Cell', () => {
    const dateColumn = getColumn('due_date');
    const CellComponent = dateColumn.cell;

    it('should correctly format a valid ISO date string', () => {
      const mockRow = {
        getValue: (key) =>
          key === 'due_date' ? '2023-10-27T10:00:00.000Z' : null,
      };
      render(<CellComponent row={mockRow} table={{}} />);
      expect(screen.getByText('10/27/2023')).toBeInTheDocument();
    });

    it('should render "N/A" for a null or undefined date', () => {
      const mockRowNull = {
        getValue: (key) => (key === 'due_date' ? null : null),
      };
      const { rerender } = render(
        <CellComponent row={mockRowNull} table={{}} />
      );
      expect(screen.getByText('N/A')).toBeInTheDocument();

      const mockRowUndefined = {
        getValue: (key) => (key === 'due_date' ? undefined : null),
      };
      rerender(<CellComponent row={mockRowUndefined} table={{}} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});
