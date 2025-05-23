import React, { useState, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
// import ProjectContext from '../../context/ProjectContext'; // To update project list
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';


const AddProjectForm = ({ onProjectAdded }) => { // onProjectAdded is a callback
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    setIsLoading(true);

    try {
      // Use token from AuthContext
      if (!auth.token) {
        setError('Authentication error. Please log in again.');
        setIsLoading(false);
        navigate('/auth/login');
        return;
      }

      // Use axios for the API call
      const response = await axios.post('/api/projects',
        { name: projectName.trim() }, // Request body
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`, // Use token from context
          },
        }
      );

      // Axios throws an error for non-2xx status codes, so no need for response.ok check

      // Call the callback to notify parent component (e.g., DashboardPage or ProjectList)
      if (onProjectAdded) {
        onProjectAdded(response.data.project); // Pass the newly created project data (axios puts response in .data)
      }

      setProjectName(''); // Clear form
      toast.success('Project created successfully!');

    } catch (err) {
      // Handle axios errors (including non-2xx responses)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create project. Please try again.';
      setError(errorMessage);
      console.error('Create project error:', err);

      // If 401 error, potentially log out the user
      if (err.response?.status === 401) {
          auth.logout();
          navigate('/auth/login');
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Create New Project</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
