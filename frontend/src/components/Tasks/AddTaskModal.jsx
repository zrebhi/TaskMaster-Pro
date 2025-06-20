import { useContext } from 'react';
import TaskContext from '../../context/TaskContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddTaskForm from './AddTaskForm';

const AddTaskModal = ({ isOpen, onClose, projectId }) => {
  const { isLoadingTasks } = useContext(TaskContext);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoadingTasks && onClose(open)}>
      <DialogContent className="sm:max-w-[425px] solid-popover-bg">
        <DialogHeader>
          <DialogTitle />
          <DialogDescription /> 
        </DialogHeader>
        <AddTaskForm projectId={projectId} onTaskAdded={onClose} />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;