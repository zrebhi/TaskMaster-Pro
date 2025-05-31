import { useState, useContext } from 'react';
import ProjectContext from '../../context/ProjectContext';

const AddProjectForm = () => {
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
    } catch (err) {
      console.error('Create project error:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Create New Project</h4>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <div>
        <label htmlFor="projectName">Project Name:</label>
        <input
          type="text"
          id="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g., Work Tasks, Home Renovation"
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
};

export default AddProjectForm;
