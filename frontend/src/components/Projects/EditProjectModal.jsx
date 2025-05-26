import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

// Basic Modal Styling (can be improved with a dedicated modal library or CSS)
const modalStyle = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  backgroundColor: 'white', padding: '20px', zIndex: 1000,
  border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
};

const EditProjectModal = ({ project, isOpen, onClose, onProjectUpdated }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    // Pre-fill form when project data changes (e.g., when modal opens for a specific project)
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await axios.put(`/api/projects/${project.id}`,
        { name: projectName.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      onProjectUpdated(response.data.project);
      onClose();

    } catch (err) {
      console.error('Update project error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to update project.');
      }

      if (err.response && err.response.status === 401) {
        logout();
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <h3>Edit Project</h3>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <label htmlFor="editProjectName">Project Name:</label>
            <input
              type="text"
              id="editProjectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} style={{ marginLeft: '10px' }} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditProjectModal;