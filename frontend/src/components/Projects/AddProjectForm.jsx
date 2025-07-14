import { useState } from 'react';
import { PROJECT_NAME_MAX_LENGTH } from '@/config/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddProjectForm = ({
  className,
  onAddProject, // The `mutate` function from the parent
  isAddingProject, // The `isPending` state from the parent
  apiError, // The `error` object from the parent's mutation hook
  ...props
}) => {
  const [projectName, setProjectName] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!projectName.trim()) {
      setValidationError('Project name cannot be empty.');
      return;
    }

    // Call the mutation function passed down from the parent.
    onAddProject({ name: projectName.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('pt-4', className)} {...props}>
      <div className="flex flex-col gap-6">
        {/* Display either an API error from the parent or a local validation error */}
        {apiError || validationError ? (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {apiError || validationError}
          </div>
        ) : null}
        <div className="grid gap-3">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            name="projectName"
            type="text"
            placeholder="e.g., Work Tasks, Home Renovation"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            disabled={isAddingProject}
            maxLength={PROJECT_NAME_MAX_LENGTH}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isAddingProject}>
          {isAddingProject ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default AddProjectForm;
