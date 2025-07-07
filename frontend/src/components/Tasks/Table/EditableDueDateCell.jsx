import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getToday } from '@/lib/utils';
import { useError } from '@/context/ErrorContext';
import { ERROR_SEVERITY } from '@/utils/errorHandler';


// Helper to format the date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // The date from the DB is 'YYYY-MM-DD'. JS treats this as UTC midnight.
    // To prevent the date from shifting to the previous day in some timezones,
    // we adjust it by the user's timezone offset before formatting.
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const EditableDueDateCell = ({ row, table }) => {
  const { meta } = table.options;
  const task = row.original;

  const { showErrorToast } = useError();
  const isEditing =
    meta.editingCell?.taskId === task.id &&
    meta.editingCell?.field === 'due_date';

  const [currentValue, setCurrentValue] = useState('');
  const inputRef = useRef(null);

  // Focus and initialize value when editing starts
  useEffect(() => {
    if (isEditing) {
      // Format date for the input field which expects YYYY-MM-DD
      const initialValue = task.due_date ? task.due_date.split('T')[0] : '';
      setCurrentValue(initialValue);
      inputRef.current?.focus();
    }
  }, [isEditing, task.due_date]);

  const handleBlur = () => {
    // Prevent saving if the user manually entered a past date.
    if (currentValue && currentValue < getToday()) {
      showErrorToast({
        message: 'The due date cannot be in the past.',
        severity: ERROR_SEVERITY.LOW, // Use a low severity for validation issues
      });
      meta.setEditingCell(null); // Exit editing mode without saving
      return;
    }

    const originalValue = task.due_date ? task.due_date.split('T')[0] : '';
    // Only send an update if the value has actually changed

    if (currentValue !== originalValue) {
      meta.onPatchTask(task.id, { due_date: currentValue || null });
    }
    meta.setEditingCell(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // onBlur will handle saving and closing
      e.target.blur();
    } else if (e.key === 'Escape') {
      // Exit without saving
      meta.setEditingCell(null);
    }
  };

  if (isEditing) {
    return (
      <form>
        <Input
          ref={inputRef}
          type="date"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={getToday()} // Prevent past dates
          aria-label="Edit due date"
        />
      </form>
    );
  }

  return (
    <Button
      type="button"
      variant={'ghost'}
      onClick={() => {
        meta.setEditingCell({ taskId: task.id, field: 'due_date' });
      }}
      className="w-full justify-start text-left font-normal"
      aria-label={`Change due date for ${task.title}. Current: ${formatDate(
        task.due_date
      )}`}
    >
      {formatDate(task.due_date)}
    </Button>
  );
};

export default EditableDueDateCell;
