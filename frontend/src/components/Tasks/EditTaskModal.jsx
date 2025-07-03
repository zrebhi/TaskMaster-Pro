import { useContext } from 'react';
import TaskContext from '@/context/TaskContext';
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
  const { updateTask, isLoadingTasks } = useContext(TaskContext);

  const handleUpdateTask = async (taskData) => {
    if (!task?.id) {
      throw new Error('No task selected for update.');
    }
    await updateTask(task.id, taskData);
    onClose(); // Close the modal on successful submission
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoadingTasks && onClose(open)}
    >
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
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
            isLoading={isLoadingTasks}
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
              disabled={isLoadingTasks}
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
