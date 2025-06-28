import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTableFacetedFilter } from '../../../../../components/ui/tables/data-table-faceted-filter';
import { statuses } from '../../../../../data/taskUIData';

// Mock Tanstack Table's column object
const createMockColumn = () => ({
  // getFilterValue: jest.fn().mockReturnValue(new Set()), // No longer used for state
  setFilterValue: jest.fn(),
  getFacetedUniqueValues: jest.fn().mockReturnValue(new Map()),
  id: 'status', // Add id to mock column
});

describe('Unit Test: DataTableFacetedFilter', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  // User Story: "As a developer, I want to ensure my filter component correctly
  // displays its options and communicates with the table instance."
  it('should render the provided options and call setFilterValue on selection', async () => {
    const mockColumn = createMockColumn();
    render(
      <DataTableFacetedFilter
        column={mockColumn}
        title="Status"
        options={statuses}
        columnFilters={[]} // Start with no filters
      />
    );

    // WHEN: The user opens the filter popover
    await user.click(screen.getByRole('button', { name: /status/i }));

    // THEN: All options from the props are rendered
    expect(
      await screen.findByRole('menuitemcheckbox', { name: /to do/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', { name: /done/i })
    ).toBeInTheDocument();

    // AND WHEN: The user selects an option
    await user.click(screen.getByRole('menuitemcheckbox', { name: /done/i }));

    // THEN: The component correctly calls the table's setFilterValue function
    // This confirms the component is wired correctly internally.
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(['done']);
  });

  it('should handle selecting multiple options', async () => {
    const mockColumn = createMockColumn();
    // Pass columnFilters to control the component's state
    const { rerender } = render(
      <DataTableFacetedFilter
        column={mockColumn}
        title="Status"
        options={statuses}
        columnFilters={[]}
      />
    );

    await user.click(screen.getByRole('button', { name: /status/i }));

    // 1. User clicks "To Do"
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: /to do/i })
    );
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(['to do']);

    // 2. We simulate the parent component updating the prop
    rerender(
      <DataTableFacetedFilter
        column={mockColumn}
        title="Status"
        options={statuses}
        columnFilters={[{ id: 'status', value: ['to do'] }]}
      />
    );

    // 3. User clicks "Done"
    await user.click(screen.getByRole('menuitemcheckbox', { name: /done/i }));
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(['to do', 'done']);
  });

  it('should handle deselecting an option', async () => {
    const mockColumn = createMockColumn();
    // Simulate a value already being selected by passing it in columnFilters
    const initialFilters = [{ id: 'status', value: ['done'] }];

    render(
      <DataTableFacetedFilter
        column={mockColumn}
        title="Status"
        options={statuses}
        columnFilters={initialFilters}
      />
    );

    await user.click(screen.getByRole('button', { name: /status/i }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: /done/i }));

    // Expect the filter to be cleared
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(undefined);
  });
});
