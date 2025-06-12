import { useState, useContext } from 'react';
import ProjectContext from '../../context/ProjectContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddProjectForm = ({ className, ...props }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const { addProject, isLoading } = useContext(ProjectContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      await addProject({ name: projectName.trim() });
      setProjectName('');
    } catch{
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <Card className={cn('w-full max-w-sm', className)} {...props}>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>
          Enter a name for your new project below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {error ? <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div> : null}
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddProjectForm;
