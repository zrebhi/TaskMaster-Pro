// @ts-check
/**
 * @file Unit tests for the Task table's column definitions.
 * @see ../../../../../components/Tasks/Table/columns.jsx
 */

import { render, screen } from '@testing-library/react';
import { columns } from '../../../../../components/Tasks/Table/columns';

// Mock child components to isolate the logic in `columns.jsx`. This allows
// us to test the props being passed without testing the child components'
// implementation details.
jest.mock('../../../../../components/ui/badge', () => ({
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
jest.mock('../../../../../components/ui/tables/data-table-row-actions', () => ({
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

  describe('Priority Cell', () => {
    const priorityColumn = getColumn('priority');
    const CellComponent = priorityColumn.cell;

    it('should render a "High" priority visual for a priority value of 3', () => {
      // Arrange: Create a mock row that simulates Tanstack Table's row API.
      const mockRow = {
        getValue: (key) => (key === 'priority' ? 3 : null),
      };

      // Act: Render the cell component with the mock data.
      render(<CellComponent row={mockRow} table={{}} />);

      // Assert: Verify the correct label and badge variant are rendered.
      expect(screen.getByText('High')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'destructive_table');
    });

    it('should render a "Medium" priority visual for a priority value of 2', () => {
      const mockRow = {
        getValue: (key) => (key === 'priority' ? 2 : null),
      };
      render(<CellComponent row={mockRow} table={{}} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });

    it('should render a "Low" priority visual for a priority value of 1', () => {
      const mockRow = {
        getValue: (key) => (key === 'priority' ? 1 : null),
      };
      render(<CellComponent row={mockRow} table={{}} />);
      expect(screen.getByText('Low')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Status Cell', () => {
    const statusColumn = getColumn('status');
    const CellComponent = statusColumn.cell;

    it('should render a "Done" status visual for a status value of "done"', () => {
      const mockRow = {
        getValue: (key) => (key === 'status' ? 'done' : null),
      };
      render(<CellComponent row={mockRow} table={{}} />);
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByTestId('icon-done')).toBeInTheDocument();
    });

    it('should render a "To Do" status visual for a status value of "to do"', () => {
      const mockRow = {
        getValue: (key) => (key === 'status' ? 'to do' : null),
      };
      render(<CellComponent row={mockRow} table={{}} />);
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByTestId('icon-todo')).toBeInTheDocument();
    });
  });

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
