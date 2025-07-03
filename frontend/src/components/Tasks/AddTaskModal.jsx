import { useContext } from 'react';
import TaskContext from '@/context/TaskContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TaskForm from './TaskForm';

const AddTaskModal = ({ isOpen, onClose, projectId }) => {
  const { isLoadingTasks, addTask } = useContext(TaskContext);

  const handleAddTask = async (taskData) => {
    if (!projectId) {
      throw new Error('No project selected.');
    }
    await addTask(projectId, taskData);
    onClose(); // Close the modal on successful submission
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoadingTasks && onClose(open)}
    >
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
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
            isLoading={isLoadingTasks}
            submitButtonText="Create Task"
            loadingButtonText="Creating..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
