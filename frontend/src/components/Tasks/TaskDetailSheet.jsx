import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const TaskDetailSheet = ({ task, isOpen, onClose }) => {
  // If no task is selected, we don't render anything.
  // This is a safeguard, though the parent component's logic should prevent this.
  if (!task) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        {/* Header Section */}
        <SheetHeader className="p-6">
          <SheetTitle className="text-2xl">{task.title}</SheetTitle>
          <SheetDescription>
            Details for this task. You can view and edit information here.
          </SheetDescription>
        </SheetHeader>

        {/* Body Section (for future content) */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Placeholder for future task details */}
          <p>Task details will go here...</p>
        </div>

        {/* Footer Section (for future actions) */}
        <SheetFooter className="p-6 pt-0">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;