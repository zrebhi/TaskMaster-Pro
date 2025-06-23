import { useContext } from 'react';
import ProjectContext from '../../context/ProjectContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddProjectForm from './AddProjectForm';

const AddProjectModal = ({ isOpen, onClose }) => {
  const { isLoading } = useContext(ProjectContext);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose(open)}>
      <DialogContent className="sm:max-w-[425px] solid-popover-bg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project below. Click create when you{'\''}re done.
          </DialogDescription>
        </DialogHeader>
        <AddProjectForm onSuccess={onClose} />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
