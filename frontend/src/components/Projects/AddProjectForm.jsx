import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectContext from '@/context/ProjectContext';
import { getErrorMessage } from '@/utils/errorHandler';
import { PROJECT_NAME_MAX_LENGTH } from '@/config/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddProjectForm = ({ className, onSuccess, ...props }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const { addProject, isLoading } = useContext(ProjectContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      const newProject = await addProject({ name: projectName.trim() });
      setProjectName('');
      if (onSuccess) onSuccess();
      if (newProject?.id) {
        navigate(`/projects/${newProject.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'creating the project'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('pt-4', className)} {...props}>
      <div className="flex flex-col gap-6">
        {error ? (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
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
            disabled={isLoading}
            maxLength={PROJECT_NAME_MAX_LENGTH}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default AddProjectForm;
