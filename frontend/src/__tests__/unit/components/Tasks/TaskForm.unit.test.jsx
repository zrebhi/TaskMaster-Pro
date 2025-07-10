// @ts-check
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '@/components/Tasks/TaskForm';

// We are no longer mocking the Select component to ensure our tests
// accurately reflect the real user interaction with the complex
// shadcn/ui component.

describe('TaskForm: Unit Tests', () => {
  const mockOnSubmit = jest.fn();
  const mockProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    submitButtonText: 'Submit Task',
    loadingButtonText: 'Submitting...',
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Validation', () => {
    it('should display a validation error and prevent submission if the title contains only spaces', async () => {
      const user = userEvent.setup();
      render(<TaskForm {...mockProps} />);

      await user.type(screen.getByLabelText(/task title/i), '   ');
      await user.click(screen.getByRole('button', { name: /submit task/i }));

      expect(
        await screen.findByText(
          /Task title is required/i
        )
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Submission', () => {
    it('should call the onSubmit prop with correctly formatted data upon successful submission', async () => {
      const user = userEvent.setup();
      render(<TaskForm {...mockProps} />);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateString = futureDate.toISOString().split('T')[0];

      // Fill out the form with valid data
      await user.type(
        screen.getByLabelText(/task title/i),
        '  A new task title  '
      );
      await user.type(
        screen.getByLabelText(/description/i),
        '  A description.  '
      );
      await user.type(screen.getByLabelText(/due date/i), futureDateString);

      // Interact with the real Select component
      // 1. Click the trigger to open the dropdown
      await user.click(screen.getByRole('combobox', { name: /priority/i }));
      // 2. Click the desired option. `findByRole` waits for it to appear.
      await user.click(await screen.findByRole('option', { name: /high/i }));

      // 3. Submit the form
      await user.click(screen.getByRole('button', { name: /submit task/i }));

      // Assert that the onSubmit handler was called with trimmed and formatted data
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'A new task title',
        description: 'A description.',
        due_date: futureDateString,
        priority: 3, // 'High' corresponds to value 3
      });
    });
  });

  describe('Initial State', () => {
    it('should populate the form fields correctly when given initialData for editing', () => {
      const initialData = {
        title: 'Existing Task Title',
        description: 'Existing task description.',
        due_date: '2025-12-01T00:00:00.000Z',
        priority: 1, // Corresponds to "Low"
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

      // For the real Select, we check the displayed text inside the trigger,
      // not the element's `value` attribute. The component correctly displays "Low" for priority 1.
      expect(
        screen.getByRole('combobox', { name: /priority/i })
      ).toHaveTextContent(/low/i);
    });
  });

  describe('Submission Failure', () => {
    it('should display an API error message within the form if the onSubmit promise rejects', async () => {
      const user = userEvent.setup();
      // Mock the onSubmit prop to simulate a failed API call
      const apiErrorMessage = 'API Error: This title is a duplicate.';
      const failingOnSubmit = jest
        .fn()
        .mockRejectedValue(new Error(apiErrorMessage));

      render(<TaskForm {...mockProps} onSubmit={failingOnSubmit} />);

      // Fill out the form with valid data and submit
      await user.type(screen.getByLabelText(/task title/i), 'A valid title');
      await user.click(screen.getByRole('button', { name: /submit task/i }));

      // Assert that the error message from the rejected promise is displayed
      expect(await screen.findByText(apiErrorMessage)).toBeInTheDocument();
    });
  });
});
