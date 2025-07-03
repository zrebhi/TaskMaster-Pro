import { useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { priorities } from '@/data/taskUIData';

// A dedicated component for the editable priority cell
const EditablePriorityCell = ({ row, table }) => {
  const { meta } = table.options;
  const task = row.original;
  const isEditing =
    meta.editingCell?.taskId === task.id &&
    meta.editingCell?.field === 'priority';
  const selectTriggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const priority = priorities.find((p) => p.value === task.priority);

  useEffect(() => {
    if (isEditing) {
      // Directly open the select dropdown when editing starts
      setIsOpen(true);
      // Focus is handled by the Select component's trigger
    } else {
      setIsOpen(false);
    }
  }, [isEditing]);

  const handlePriorityChange = (newPriorityValue) => {
    const priorityInt = parseInt(newPriorityValue, 10);
    if (isNaN(priorityInt)) {
      console.error('Invalid priority value:', newPriorityValue);
      return;
    }
    try {
      meta.onPatchTask(task.id, { priority: priorityInt });
      meta.setEditingCell(null);
    } catch (error) {
      console.error('Failed to update task priority:', error);
      // Optionally show user-facing error message
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      // When the dropdown closes (e.g., blur, escape), exit edit mode.
      meta.setEditingCell(null);
    }
  };

  if (isEditing) {
    return (
      <Select
        value={task.priority?.toString() || ''}
        onValueChange={handlePriorityChange}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger
          ref={selectTriggerRef}
          className="h-8 w-[100px] focus:ring-2 focus:ring-ring"
          aria-label={`Editing priority for ${task.title}`}
          // We add an on-click handler here to ensure that if a user clicks
          // the trigger of an already open select, it closes as expected.
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          {priorities.map((p) => (
            <SelectItem key={p.value} value={p.value.toString()}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        meta.setEditingCell({ taskId: task.id, field: 'priority' })
      }
      className="flex w-full items-center gap-2 rounded-md p-1 -ml-1 text-left hover:bg-muted transition-colors"
      aria-label={`Change priority for ${task.title}. Current: ${priority?.label}`}
    >
      <Badge
        variant={
          priority?.label === 'High'
            ? 'destructive'
            : priority?.label === 'Low'
              ? 'outline'
              : 'default'
        }
      >
        {priority?.label || 'N/A'}
      </Badge>
    </button>
  );
};

export default EditablePriorityCell;
