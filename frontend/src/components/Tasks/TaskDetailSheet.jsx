import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Undo2,
  Edit,
  Trash2,
  Circle,
  Flag,
  Calendar,
} from 'lucide-react';
import { priorities, statuses } from '@/data/taskUIData';

// A small, reusable component to display a property in the sheet.
const TaskProperty = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground w-24">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className="text-sm font-medium">{children}</div>
  </div>
);

// Helper to format the date for display
const formatDate = (dateString) => {
  if (!dateString)
    return <span className="text-muted-foreground">Not set</span>;
  try {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const TaskDetailSheet = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  if (!task) return null;

  const priority = priorities.find((p) => p.value === task.priority);
  // Determine the status value based on the is_completed flag
  const statusValue = task.is_completed ? 'done' : 'to do';
  // Find the corresponding status object from our UI data
  const status = statuses.find((s) => s.value === statusValue);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg px-6 py-4 space-y-6">
        {/* Header Section */}
        <SheetHeader className="flex flex-row justify-between p-0">
          <div className="flex-1 flex-col">
            <SheetTitle className="flex items-start justify-between text-2xl">
              {task.title}
            </SheetTitle>
            <SheetDescription>
              Created on {formatDate(task.createdAt)}
            </SheetDescription>
          </div>
          <div className="flex justify-end items-end">
            <Button
              variant={task.is_completed ? 'outline' : 'default'}
              size="sm"
              onClick={() => onToggleComplete(task)}
            >
              {task.is_completed ? (
                <Undo2 className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {task.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          </div>
        </SheetHeader>

        {/* Body Section */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {/* Status, Priority, Due Date */}
          <div className="space-y-4 rounded-lg border bg-background p-4">
            <TaskProperty icon={Circle} label="Status">
              {task.is_completed ? (
                <p className="text-success">
                  <Check className="inline h-4 w-4 mr-1" />
                  {status?.label || 'Done'}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {status?.label || 'To Do'}
                </p>
              )}
            </TaskProperty>
            <TaskProperty icon={Flag} label="Priority">
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
            </TaskProperty>
            <TaskProperty icon={Calendar} label="Due Date">
              {formatDate(task.due_date)}
            </TaskProperty>
          </div>

          {/* Description */}
          <div className="space-y-2 my-4">
            <h3 className="font-medium">Description</h3>
            <p className="text-sm text-muted-foreground">
              {task.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Footer Section */}
        <SheetFooter className="flex p-0">
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => onEdit(task)}
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(task)}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;
