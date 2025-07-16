import { useAddTask } from '@/hooks/useTasks';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TaskForm from './TaskForm';

const AddTaskModal = ({ isOpen, onClose, projectId }) => {
  const { mutate: addTask, isPending: isAddingTask } = useAddTask({
    onMutationSuccess: () => {
      onClose(); // Close the modal on successful submission
    },
  });

  const handleAddTask = async (taskData) => {
    if (!projectId) {
      throw new Error('No project selected.');
    }
    addTask({ projectId, taskData });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isAddingTask && onClose(open)}
    >
      <DialogContent
        className="sm:max-w-[425px] flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project with details and priority. Click
            create when you{"'"}re done.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto -mr-4 pr-4">
          <TaskForm
            onSubmit={handleAddTask}
            isLoading={isAddingTask}
            submitButtonText="Create Task"
            loadingButtonText="Creating..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
