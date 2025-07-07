import { useState, useEffect, useContext } from 'react';
import ProjectContext from '@/context/ProjectContext';
import { getErrorMessage } from '@/utils/errorHandler';
import { PROJECT_NAME_MAX_LENGTH } from '@/config/constants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EditProjectModal = ({ project, isOpen, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const { updateProject, isLoading } = useContext(ProjectContext);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      await updateProject(project.id, { name: projectName.trim() });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'updating the project'));
    }
  };

  // Use onOpenChange for controlled dialog state
  const handleOpenChange = (open) => {
    if (!isLoading) {
      // Prevent closing while loading
      if (!open) {
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Make changes to your project here. Click save when you{"'"}re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 py-4">
            {!!error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-3">
              <Label htmlFor="editProjectName">Project Name</Label>
              <Input
                id="editProjectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Website Redesign, Q3 Marketing Campaign"
                required
                disabled={isLoading}
                maxLength={PROJECT_NAME_MAX_LENGTH}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;
