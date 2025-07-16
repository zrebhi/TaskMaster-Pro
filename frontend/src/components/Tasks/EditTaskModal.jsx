import { useUpdateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import TaskForm from './TaskForm'; // Import the new reusable form

const EditTaskModal = ({ task, isOpen, onClose }) => {
  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask({
    onMutationSuccess: () => {
      onClose(); // Close the modal on successful submission
    },
  });

  const handleUpdateTask = async (taskData) => {
    if (!task?.id || !task?.project_id) {
      throw new Error('No task or project_id selected for update.');
    }
    // Pass projectId along with other data
    updateTask({
      taskId: task.id,
      taskData,
      projectId: task.project_id.toString(),
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isUpdatingTask && onClose(open)}
    >
      <DialogContent
        className="sm:max-w-[425px] flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you{"'"}re done.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto -mr-4 pr-4 mb-0">
          <TaskForm
            initialData={task}
            onSubmit={handleUpdateTask}
            isLoading={isUpdatingTask}
            submitButtonText="Save Changes"
            loadingButtonText="Saving..."
          />
        </div>
        {/* The TaskForm has its own button, but we can add a cancel button here */}
        <DialogFooter>
          <div className="w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdatingTask}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
