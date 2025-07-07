// @ts-check
/**
 * @file Unit tests for the TaskForm component.
 * @see @/components/Tasks/TaskForm.jsx
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '@/components/Tasks/TaskForm';

// The shadcn/ui Select component is complex and causes issues in JSDOM.
// We mock it to provide a simple, standard <select> element, allowing us
// to test the form's logic without fighting the component's implementation details.
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }) => (
    <select
      onChange={(e) => onValueChange(e.target.value)}
      value={value}
      aria-label="Priority"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }) => <>{children}</>,
  SelectContent: ({ children }) => <>{children}</>,
  SelectItem: ({ children, value }) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: () => null,
}));

describe('TaskForm: Unit Tests', () => {
  const mockOnSubmit = jest.fn();
  const mockProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    submitButtonText: 'Submit Task',
    loadingButtonText: 'Submitting...',
  };

  // Before each test, reset mock function call history
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Validation', () => {
    it('should display a validation error and prevent submission if the title contains only spaces', async () => {
      render(<TaskForm {...mockProps} />);

      await userEvent.type(screen.getByLabelText(/task title/i), '   ');
      await userEvent.click(
        screen.getByRole('button', { name: /submit task/i })
      );

      expect(
        await screen.findByText(
          /Task title cannot be empty or contain only spaces/i
        )
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Submission', () => {
    it('should call the onSubmit prop with correctly formatted data upon successful submission', async () => {
      render(<TaskForm {...mockProps} />);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateString = futureDate.toISOString().split('T')[0];

      // Fill out the form with valid data
      await userEvent.type(
        screen.getByLabelText(/task title/i),
        '  A new task title  '
      );
      await userEvent.type(
        screen.getByLabelText(/description/i),
        '  A description.  '
      );
      await userEvent.type(
        screen.getByLabelText(/due date/i),
        futureDateString
      );
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: /priority/i }),
        '3' // 'High'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /submit task/i })
      );

      // Assert that the onSubmit handler was called with trimmed and formatted data
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'A new task title',
        description: 'A description.',
        due_date: futureDateString,
        priority: 3,
      });
    });
  });

  describe('Initial State', () => {
    it('should populate the form fields correctly when given initialData for editing', () => {
      const initialData = {
        title: 'Existing Task Title',
        description: 'Existing task description.',
        due_date: '2025-12-01T00:00:00.000Z',
        priority: 1, // Low
      };

      render(<TaskForm {...mockProps} initialData={initialData} />);

      // Assert that form inputs are pre-filled with the initial data
      expect(screen.getByLabelText(/task title/i)).toHaveValue(
        initialData.title
      );
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        initialData.description
      );
      // The component formats the date to YYYY-MM-DD for the input
      expect(screen.getByLabelText(/due date/i)).toHaveValue('2025-12-01');
      expect(screen.getByRole('combobox', { name: /priority/i })).toHaveValue(
        initialData.priority.toString()
      );
    });
  });

  describe('Submission Failure', () => {
    it('should display an API error message within the form if the onSubmit promise rejects', async () => {
      // Mock the onSubmit prop to simulate a failed API call
      const apiErrorMessage = 'API Error: This title is a duplicate.';
      const failingOnSubmit = jest
        .fn()
        .mockRejectedValue(new Error(apiErrorMessage));

      render(<TaskForm {...mockProps} onSubmit={failingOnSubmit} />);

      // Fill out the form with valid data and submit
      await userEvent.type(
        screen.getByLabelText(/task title/i),
        'A valid title'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /submit task/i })
      );

      // Assert that the error message from the rejected promise is displayed
      expect(await screen.findByText(apiErrorMessage)).toBeInTheDocument();
    });
  });
});
