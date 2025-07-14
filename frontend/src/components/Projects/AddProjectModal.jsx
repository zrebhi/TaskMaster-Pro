import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddProject } from '@/hooks/useProjects';
import { getErrorMessage } from '@/utils/errorHandler';
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
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  // The mutation logic now lives in the "smart" parent component.
  const { mutate, isPending } = useAddProject({
    onMutationSuccess: (newProject) => {
      setApiError('');
      onClose(); // Close the modal
      if (newProject?.id) {
        navigate(`/projects/${newProject.id}`); // Handle navigation
      }
    },
    onMutationError: (err) => {
      // Set an error state that can be passed down to the form.
      setApiError(getErrorMessage(err, 'creating the project'));
    },
  });

  const handleAddProject = (projectData) => {
    // Clear previous errors before a new attempt
    setApiError('');
    mutate(projectData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isPending && onClose(!open)}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project below. Click create when you{'\''}re
            done.
          </DialogDescription>
        </DialogHeader>
        {/* Pass down the mutation function, loading state, and error state */}
        <AddProjectForm
          onAddProject={handleAddProject}
          isAddingProject={isPending}
          apiError={apiError}
        />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
