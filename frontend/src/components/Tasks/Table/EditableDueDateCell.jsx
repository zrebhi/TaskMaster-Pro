import { useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { Button } from '@/components/ui/button';

// Helper to format the date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const EditableDueDateCell = ({ row, table }) => {
  const { meta } = table.options;
  const task = row.original;
  const isEditing =
    meta.editingCell?.taskId === task.id &&
    meta.editingCell?.field === 'due_date';

  // Create a ref for the entire editing widget container
  const wrapperRef = useRef(null);

  const handleDateChange = (date) => {
    if (!date) return;
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const formattedDate = date.toISOString().slice(0, 10);
    meta.onPatchTask(task.id, { due_date: formattedDate });
    meta.setEditingCell(null);
  };

  const handleClearDate = () => {
    meta.onPatchTask(task.id, { due_date: null });
    meta.setEditingCell(null);
  };

  // We add an effect to handle clicks outside our entire component.
  useEffect(() => {
    function handleClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        meta.setEditingCell(null);
      }
    }
    if (isEditing) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isEditing, meta]);

  if (isEditing) {
    return (
      // Use the ref on the wrapper div
      <div ref={wrapperRef} className="flex items-center gap-1">
        <DatePicker
          selected={task.due_date ? new Date(task.due_date) : null}
          onChange={handleDateChange}
          minDate={new Date()}
          showPopperArrow={false}
          popperClassName="z-50"
          startOpen
          // We no longer need the library's outside click handler
          // onClickOutside={handleClickOutside}
          // We render the input and button as siblings. The wrapperRef handles outside clicks.
          className="w-[110px] rounded-md border border-input bg-background px-2 py-1 text-sm h-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearDate}
          className="text-xs"
          aria-label="Clear due date"
        >
          Clear
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        meta.setEditingCell({ taskId: task.id, field: 'due_date' })
      }
      className="w-full rounded-md p-1 -ml-1 text-left hover:bg-muted transition-colors"
      aria-label={`Change due date for ${task.title}. Current: ${formatDate(
        task.due_date
      )}`}
    >
      {formatDate(task.due_date)}
    </button>
  );
};

export default EditableDueDateCell;
